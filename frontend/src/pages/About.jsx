import { useContent, useLang } from "../lib/useContent";
import { T, tr } from "../lib/i18n";

export default function About() {
  const content = useContent();
  const [lang] = useLang();

  const text = tr(content.about, lang);
  const paragraphs = String(text).split("\n").filter(Boolean);
  const photo = content.site.about_image;

  return (
    <div data-testid="about-page" className="bg-white dark:bg-black pt-32 md:pt-40 pb-24 transition-colors duration-500">
      <div className="px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-5">
          <p className="text-[11px] tracking-[0.32em] uppercase text-neutral-500 dark:text-neutral-400 mb-6">
            {tr(T.about.title, lang)}
          </p>
          <h1 className="text-4xl md:text-6xl tracking-tight font-light leading-[0.95] text-black dark:text-white">
            {content.site.name}
          </h1>
          <p className="mt-4 text-sm tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400">
            {tr(content.site.title, lang)}
          </p>

          {photo && (
            <div className="mt-10 md:mt-14 overflow-hidden bg-neutral-100 dark:bg-neutral-900 aspect-[4/5] max-w-md">
              <img
                src={photo}
                alt={content.site.name}
                data-testid="about-photo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <div className="space-y-6 text-[17px] md:text-[18px] leading-[1.7] text-neutral-800 dark:text-neutral-200 max-w-2xl">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
