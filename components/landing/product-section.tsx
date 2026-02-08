const services = [
  {
    title: "Загрузка знаний",
    description:
      "Загрузите документы, инструкции и регламенты. Мы индексируем всю базу знаний вашей компании.",
    color: "bg-pastel-yellow",
  },
  {
    title: "Генерация курсов",
    description:
      "AI автоматически создаёт структурированные курсы с модулями, материалами и проверочными заданиями.",
    color: "bg-pastel-purple",
  },
  {
    title: "Квизы и аттестации",
    description:
      "Генерация проверочных вопросов, открытых заданий и аттестаций для каждого модуля курса.",
    color: "bg-pastel-lime",
  },
  {
    title: "Стратегия обучения",
    description:
      "Уникальная траектория обучения для каждой роли и отдела вашей компании.",
    color: "bg-pastel-blue",
  },
  {
    title: "Аналитика прогресса",
    description:
      "Отслеживайте результаты сотрудников. Находите слабые места и точки роста в обучении.",
    color: "bg-pastel-lime",
  },
  {
    title: "Масштабирование",
    description:
      "Одна платформа для 10 или 1000 сотрудников. Автоматическое обновление при новых документах.",
    color: "bg-pastel-pink",
  },
];
export function ProductSection() {
  return (
    <section id="services" className="bg-white pt-10 pb-14 md:pt-14 md:pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header row */}
        <div className="mb-10 flex flex-col gap-6 border-t border-neutral-200 pt-8 md:mb-14 md:flex-row md:items-end md:justify-between md:pt-10">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide text-[#E85D3A]">
              Наши услуги
            </p>

            <h2 className="max-w-2xl text-balance text-3xl font-black tracking-tight leading-[1.05] text-[#0B0B0F] md:text-5xl md:leading-[1.02] lg:text-6xl">
              Всё, что нужно вашей команде онлайн
            </h2>
          </div>

          <p className="max-w-sm text-sm font-medium leading-relaxed text-neutral-600">
            От загрузки базы знаний до аналитики прогресса — полный цикл
            онбординга и обучения на AI-платформе.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* Pastel color block */}
              <div
                className={`h-32 ${service.color} transition-all duration-300 group-hover:h-36`}
              />

              {/* Content */}
              <div className="p-6">
                <h3 className="mb-2 text-base font-extrabold tracking-tight text-[#0B0B0F] md:text-lg">
                  {service.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-neutral-600">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
