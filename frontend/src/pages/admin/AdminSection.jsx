export const AdminSection = ({ title, description, actions, testId, children }) => (
  <section
    className="border border-white/10 p-6 md:p-8 mb-8"
    data-testid={testId}
  >
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl tracking-tight text-white">{title}</h2>
        {description && (
          <p className="mt-2 text-[12px] text-neutral-500 max-w-2xl">{description}</p>
        )}
      </div>
      {actions}
    </div>
    {children}
  </section>
);
