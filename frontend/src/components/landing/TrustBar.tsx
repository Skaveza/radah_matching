const logos = [
  "Y Combinator",
  "Techstars",
  "500 Startups",
  "Indie Hackers",
  "Product Hunt",
];

const TrustBar = () => {
  return (
    <section className="py-10 border-b border-border/50 bg-secondary/30">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
          Trusted by founders from
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map((name) => (
            <span
              key={name}
              className="text-sm md:text-base font-semibold text-muted-foreground/40 select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
