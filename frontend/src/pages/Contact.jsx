import { ArrowUpRight } from "lucide-react";
import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";
import { formatPhoneDisplay, telHref } from "../lib/utils";

export default function Contact() {
  const content = useContent();
  const [lang] = useLang();
  const s = content.site.social;

  const links = [
    { key: "instagram", label: "Instagram", href: s.instagram },
    { key: "vimeo", label: "Vimeo", href: s.vimeo },
    { key: "linkedin", label: "LinkedIn", href: s.linkedin },
    { key: "imdb", label: "IMDb", href: s.imdb },
  ].filter((l) => l.href);

  return (
    <div data-testid="contact-page" className="cinema-page pt-28 sm:pt-32 md:pt-40 pb-32 min-h-screen transition-colors duration-500">
      <div className="px-6 md:px-12 lg:px-16">
        <p className="text-[10px] tracking-[0.18em] uppercase text-[var(--cinema-muted)] mb-7">
          {tr(T.contact.title, lang)}
        </p>
        <h1 className="max-w-5xl text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-[-0.045em] font-light leading-[0.88] text-[var(--cinema-fg)]">
          {tr(T.contact.headline, lang)}
        </h1>
        <p className="mt-8 text-xl md:text-3xl tracking-[-0.02em] font-light leading-tight max-w-4xl text-white/65">
          {tr(T.contact.intro, lang)}
        </p>

        <div className="mt-20 md:mt-32 grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-16 border-t border-white/10 pt-10 md:pt-14">
          <div className="md:col-span-7 space-y-7 md:space-y-8">
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-[var(--cinema-muted)] mb-4">
                {tr(T.contact.email, lang)}
              </p>
              <a
                href={`mailto:${s.email}`}
                data-testid="contact-email-link"
                className="text-2xl md:text-4xl lg:text-5xl tracking-[-0.03em] font-light text-[var(--cinema-fg)] hover:opacity-60 transition break-words inline-block"
              >
                {s.email}
              </a>
            </div>
            {s.phone && (
              <div>
                <p className="text-[10px] tracking-[0.16em] uppercase text-[var(--cinema-muted)] mb-4">
                  {tr(T.contact.phone, lang)}
                </p>
                <a
                  href={telHref(s.phone)}
                  data-testid="contact-phone-link"
                  className="text-sm md:text-base tracking-tight font-light text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition inline-block whitespace-nowrap"
                >
                  {formatPhoneDisplay(s.phone)}
                </a>
              </div>
            )}
          </div>
          <div className="md:col-span-5">
            <p className="text-[10px] tracking-[0.16em] uppercase text-[var(--cinema-muted)] mb-4">
              {tr(T.contact.follow, lang)}
            </p>
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <a
                  key={l.key}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={`contact-${l.key}`}
                  className="group inline-flex items-center justify-between border-b border-black/10 dark:border-white/10 py-3 hover:border-black dark:hover:border-white transition"
                >
                  <span className="text-base text-black dark:text-white">{l.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-black dark:text-white opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
