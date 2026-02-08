const testimonials = [
  {
    name: "Анна Козлова",
    role: "HR Director",
    company: "TechCorp",
    text: "Собрали онбординг отдела продаж за 1 день вместо 2 недель.",
    avatarBg: "bg-pastel-purple",
    avatarText: "text-purple-700",
  },
  {
    name: "Максим Петров",
    role: "VP of Development",
    company: "RetailPro",
    text: "Перестали держать знания в голове у одного человека.",
    avatarBg: "bg-pastel-blue",
    avatarText: "text-blue-700",
  },
  {
    name: "Елена Смирнова",
    role: "Product Manager",
    company: "LogiFlow",
    text: "AI-генерация квизов сэкономила сотни часов работы.",
    avatarBg: "bg-pastel-lime",
    avatarText: "text-lime-700",
  },
  {
    name: "Дмитрий Волков",
    role: "Head of Sales",
    company: "SalesHub",
    text: "Новые менеджеры выходят на скорость в 3 раза быстрее.",
    avatarBg: "bg-pastel-yellow",
    avatarText: "text-yellow-700",
  },
];

export function Testimonials() {
  return (
    <section id="reviews" className="bg-white pt-10 pb-14 md:pt-14 md:pb-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Header */}
        <div className="mb-10 border-t border-neutral-200 pt-8 text-center md:mb-14 md:pt-10">
          <p className="mb-3 text-sm font-semibold tracking-wide text-[#E85D3A]">
            Отзывы клиентов
          </p>

          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-black tracking-tight leading-[1.05] text-[#0B0B0F] md:text-5xl md:leading-[1.02] lg:text-6xl">
            Результаты наших клиентов
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-neutral-600">
            Компании экономят сотни часов и ускоряют онбординг в 3 раза.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* Top row */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${t.avatarBg} ${t.avatarText} text-sm font-black`}
                  >
                    {t.name.charAt(0)}
                  </div>

                  <div>
                    <p className="text-sm font-extrabold tracking-tight text-[#0B0B0F]">
                      {t.name}
                    </p>
                    <p className="text-xs font-medium text-neutral-500">
                      <span className="uppercase tracking-wide text-neutral-400">
                        {t.role}
                      </span>
                      <span className="text-neutral-300"> · </span>
                      <span className="font-semibold text-neutral-500">
                        {t.company}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quote mark */}
                <div className="select-none text-3xl leading-none text-neutral-200 transition-colors group-hover:text-neutral-300">
                  “”
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm font-medium leading-relaxed text-neutral-700">
                {t.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
