const PREFIX = "ddp_admin_draft_v1:";

export const saveProjectDraft = (id, payload) => {
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch {
    /* ignore quota */
  }
};

export const loadProjectDraft = (id) => {
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearProjectDraft = (id) => {
  try {
    sessionStorage.removeItem(PREFIX + id);
  } catch {
    /* ignore */
  }
};
