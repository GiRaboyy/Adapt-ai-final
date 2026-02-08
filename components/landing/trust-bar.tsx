const logos = [
  "TechCorp",
  "LogiFlow",
  "RetailPro",
  "SalesHub",
];

export function TrustBar() {
  return (
    <section className="bg-white py-10">
      <div className="relative overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-20">
          {[...logos, ...logos, ...logos, ...logos].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-6 items-center whitespace-nowrap font-display text-lg font-bold tracking-wide text-neutral-300 uppercase">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
