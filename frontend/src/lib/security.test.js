/**
 * @jest-environment node
 */
/**
 * Seguridad del panel /admin: TOTP, sanitizador, guardia de origen y flujo
 * de login completo contra los handlers (sin MongoDB → respaldo en memoria).
 */
const { hotp, verifyTotp, base32Encode, generateSecret, currentStep, base32Decode } = require('../../api/_totp');
const { assertSafePayload } = require('../../api/_sanitize');

const ORIGIN = 'https://ddanidiaz.com';
const SECRET = generateSecret();

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { res.headers[k.toLowerCase()] = v; },
    status(code) { res.statusCode = code; return res; },
    json(b) { res.body = b; return res; },
    send(b) { res.body = b; return res; },
    end() { return res; },
  };
  return res;
}

function req({ method = 'POST', url = '/api/admin-login', query = {}, headers = {}, body } = {}) {
  return {
    method,
    url,
    query,
    body,
    headers: {
      origin: ORIGIN,
      'content-type': 'application/json',
      'x-real-ip': headers.ip || '10.0.0.1',
      ...headers,
    },
  };
}

function cookieFrom(res) {
  const set = [].concat(res.headers['set-cookie'] || []);
  const hit = set.find((c) => c.startsWith('__Host-dd_admin=') && !c.startsWith('__Host-dd_admin=;'));
  return hit ? hit.split(';')[0] : null;
}

describe('TOTP (RFC 6238, SHA1 test vectors)', () => {
  const key = Buffer.from('12345678901234567890');
  const vectors = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ];
  it.each(vectors)('t=%i → %s', (t, code) => {
    expect(hotp(key, Math.floor(t / 30), { digits: 8 })).toBe(code);
  });

  it('accepts current code and ±1 step, rejects others', () => {
    const k = base32Decode(SECRET);
    const step = currentStep();
    expect(verifyTotp(SECRET, hotp(k, step))).toBe(step);
    expect(verifyTotp(SECRET, hotp(k, step - 1))).toBe(step - 1);
    expect(verifyTotp(SECRET, hotp(k, step + 5))).toBeNull();
    expect(verifyTotp(SECRET, '12a456')).toBeNull();
    expect(verifyTotp(SECRET, '')).toBeNull();
  });

  it('base32 round-trips', () => {
    const buf = Buffer.from('hello world!');
    expect(base32Decode(base32Encode(buf)).toString()).toBe('hello world!');
  });
});

describe('assertSafePayload', () => {
  it('accepts normal content', () => {
    expect(() => assertSafePayload({
      site: { showreel_url: 'https://vimeo.com/1', social: { email: 'a@b.c', phone: '+34 600', instagram: 'https://instagram.com/x' } },
      projects: [{ id: 'a', cover: '', stills: ['https://res.cloudinary.com/x.jpg'], recognitions: [{ url: 'https://x.png' }] }],
    })).not.toThrow();
  });

  it.each([
    [{ projects: [{ external_link: 'javascript:alert(1)' }] }],
    [{ projects: [{ stills: ['data:text/html,<script>'] }] }],
    [{ site: { social: { instagram: 'javascript:alert(1)' } } }],
    [{ site: { $set: { x: 1 } } }],
    [{ 'site.name': 'x' }],
    [JSON.parse('{"__proto__": {"admin": true}}')],
  ])('rejects %j', (body) => {
    expect(() => assertSafePayload(body)).toThrow(expect.objectContaining({ status: 400 }));
  });

  it('rejects oversized bodies', () => {
    expect(() => assertSafePayload({ about: { es: 'x'.repeat(1_100_000) } })).toThrow(/grande/);
  });
});

describe('admin login + session flow', () => {
  let login;
  let site;
  let content;
  const env = { ...process.env };

  beforeAll(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGO_URL;
    process.env.JWT_SECRET = 'x'.repeat(64);
    process.env.ADMIN_PASSWORD = 'correct horse battery staple';
    process.env.TOTP_SECRET = SECRET;
    jest.resetModules();
    login = require('../../api/admin-login');
    site = require('../../api/site');
    content = require('../../api/content');
  });

  afterAll(() => {
    process.env = env;
  });

  const codeAt = (offset = 0) => hotp(base32Decode(SECRET), currentStep() + offset);

  it('rejects password without valid code, then logs in with both', async () => {
    let res = mockRes();
    await login(req({ body: { password: process.env.ADMIN_PASSWORD, code: '000000' } }), res);
    expect(res.statusCode).toBe(401);
    expect(cookieFrom(res)).toBeNull();

    res = mockRes();
    await login(req({ body: { password: 'wrong', code: codeAt() } }), res);
    expect(res.statusCode).toBe(401);

    res = mockRes();
    await login(req({ body: { password: process.env.ADMIN_PASSWORD, code: codeAt() } }), res);
    expect(res.statusCode).toBe(200);
    expect(cookieFrom(res)).toMatch(/^__Host-dd_admin=/);
    expect([].concat(res.headers['set-cookie']).join()).toMatch(/HttpOnly; Secure; SameSite=Strict/);
  });

  it('rejects a reused code (replay)', async () => {
    const code = codeAt(1);
    let res = mockRes();
    await login(req({ headers: { ip: '10.0.0.2' }, body: { password: process.env.ADMIN_PASSWORD, code } }), res);
    expect(res.statusCode).toBe(200);
    res = mockRes();
    await login(req({ headers: { ip: '10.0.0.2' }, body: { password: process.env.ADMIN_PASSWORD, code } }), res);
    expect(res.statusCode).toBe(401);
  });

  it('blocks an IP after 5 failures', async () => {
    const ip = '10.0.0.9';
    for (let i = 0; i < 5; i += 1) {
      const res = mockRes();
      await login(req({ headers: { ip }, body: { password: 'nope', code: '123456' } }), res);
      expect(res.statusCode).toBe(401);
    }
    const res = mockRes();
    await login(req({ headers: { ip }, body: { password: 'nope', code: '123456' } }), res);
    expect(res.statusCode).toBe(429);
  });

  it('rejects login from a foreign origin', async () => {
    const res = mockRes();
    await login(req({ headers: { origin: 'https://evil.example' }, body: { password: 'x' } }), res);
    expect(res.statusCode).toBe(403);
  });

  it('guards writes: 401 without cookie, 403 foreign origin, 415 non-JSON, 400 unsafe body', async () => {
    // Sesión válida (ventana +? aún no usada: el replay guarda el último paso).
    const { issueSession } = require('../../api/_auth');
    const sres = mockRes();
    await issueSession(sres);
    const cookie = cookieFrom(sres);

    let res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', body: {} }), res);
    expect(res.statusCode).toBe(401);

    res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', headers: { cookie, origin: 'https://evil.example' }, body: {} }), res);
    expect(res.statusCode).toBe(403);

    res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', headers: { cookie, 'content-type': 'text/plain' }, body: {} }), res);
    expect(res.statusCode).toBe(415);

    res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', headers: { cookie }, body: { site: { social: { vimeo: 'javascript:x' } } } }), res);
    expect(res.statusCode).toBe(400);

    // Forged token with another secret / alg none
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ role: 'admin', sv: 0 }, 'y'.repeat(64), { issuer: 'ddanidiaz.com', audience: 'ddanidiaz-admin' });
    res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', headers: { cookie: `__Host-dd_admin=${forged}` }, body: {} }), res);
    expect(res.statusCode).toBe(401);
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"role":"admin","sv":0}').toString('base64url')}.`;
    res = mockRes();
    await site(req({ method: 'PUT', url: '/api/site', headers: { cookie: `__Host-dd_admin=${none}` }, body: {} }), res);
    expect(res.statusCode).toBe(401);
  });

  it('logout revokes every existing token', async () => {
    const { issueSession } = require('../../api/_auth');
    const sres = mockRes();
    await issueSession(sres);
    const cookie = cookieFrom(sres);

    let res = mockRes();
    await login(req({ method: 'GET', query: { auth: 'session' }, headers: { cookie } }), res);
    expect(res.statusCode).toBe(200);

    res = mockRes();
    await login(req({ query: { auth: 'logout' }, headers: { cookie } }), res);
    expect(res.statusCode).toBe(200);

    res = mockRes();
    await login(req({ method: 'GET', query: { auth: 'session' }, headers: { cookie } }), res);
    expect(res.statusCode).toBe(401);
  });

  it('public GET /api/content hides internal keys and drafts', async () => {
    const res = mockRes();
    await content(req({ method: 'GET', url: '/api/content', headers: {} }), res);
    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.body).some((k) => k.startsWith('_'))).toBe(false);
    expect(res.body.projects.every((p) => p.published !== false)).toBe(true);
    expect(res.headers['cache-control']).toBe('private, no-store');
  });
});
