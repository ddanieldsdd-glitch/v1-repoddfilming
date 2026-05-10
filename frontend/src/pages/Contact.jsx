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
    <div data-testid="contact-page" className="bg-white dark:bg-black pt-32 md:pt-40 pb-32 min-h-screen transition-colors duration-500">
      <div className="px-6 md:px-12 lg:px-16">
        <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-6">
          {tr(T.contact.title, lang)}
        </p>
        <p className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-light leading-[1.1] max-w-4xl text-neutral-800 dark:text-neutral-200">
          {tr(T.contact.intro, lang)}
        </p>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-7 space-y-7 md:space-y-8">
            <div>
              <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
                {tr(T.contact.email, lang)}
              </p>
              <a
                href={`mailto:${s.email}`}
                data-testid="contact-email-link"
                className="text-2xl md:text-4xl lg:text-5xl tracking-tight font-light text-black dark:text-white hover:opacity-60 transition break-words inline-block"
              >
                {s.email}
              </a>
            </div>
            {s.phone && (
              <div>
                <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
                  {tr(T.contact.phone, lang)}
                </p>
                <a
                  href={telHref(s.phone)}
                  data-testid="contact-phone-link"
                  className="text-base md:text-xl tracking-tight font-light text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition inline-block whitespace-nowrap"
                >
                  {formatPhoneDisplay(s.phone)}
                </a>
              </div>
            )}
          </div>
          <div className="md:col-span-5">
            <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-4">
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
