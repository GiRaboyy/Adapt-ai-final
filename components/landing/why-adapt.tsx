"use client";

import { ArrowRight, FileText, BookOpen, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Загрузили знания",
    description:
      "Документы, регламенты, презентации, FAQ — всё, что уже есть у вашей компании. Любой формат.",
    accent: "bg-pastel-lime text-lime",
    cardBg: "bg-pastel-lime",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Получили курс",
    description:
      "AI строит структуру обучения, генерирует квизы, открытые вопросы и аттестации автоматически.",
    accent: "bg-pastel-purple text-purple-600",
    cardBg: "bg-pastel-purple",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Видите результат",
    description:
      "Прогресс каждого сотрудника, пробелы в знаниях, точки роста — всё в реальном времени.",
    accent: "bg-pastel-blue text-blue-600",
    cardBg: "bg-pastel-blue",
  },
];

const stats = [
  { value: "3x", label: "быстрее онбординг" },
  { value: "85%", label: "экономия времени HR" },
  { value: "500+", label: "сотрудников обучено" },
];

export function WhyAdapt({ onBookCall }: { onBookCall: () => void }) {
  return (
    <section id="about" className="bg-white pt-10 pb-14 md:pt-14 md:pb-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {/* Section header */}
        <div className="mb-10 flex flex-col gap-6 border-t border-neutral-200 pt-8 md:mb-14 md:flex-row md:items-end md:justify-between md:pt-10">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold tracking-wide text-[#E85D3A]">
              Как это работает
            </p>

            <h2 className="text-balance text-3xl font-black tracking-tight leading-[1.05] text-[#0B0B0F] md:text-5xl md:leading-[1.02] lg:text-6xl">
              Три шага от документов до готового курса
            </h2>
          </div>

          <p className="max-w-sm text-sm font-medium leading-relaxed text-neutral-600 md:text-right">
            Три простых шага от хаоса в документах до структурированного обучения
            всей компании.
          </p>
        </div>

        {/* Step cards */}
        <div className="mb-12 grid gap-5 md:mb-14 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* Colored top block */}
              <div
                className={`h-28 ${step.cardBg} transition-all duration-300 group-hover:h-32`}
              />

              {/* Content */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${step.accent}`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>

                  <span className="text-3xl font-black tracking-tight text-neutral-200">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-extrabold tracking-tight text-[#0B0B0F]">
                  {step.title}
                </h3>

                <p className="text-sm font-medium leading-relaxed text-neutral-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex flex-col items-center gap-8 rounded-2xl border-2 border-neutral-200 bg-white px-7 py-10 md:flex-row md:justify-between md:px-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-14">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <span
                  className="block text-4xl font-black tracking-tight md:text-5xl"
                  style={{ color: "#8B9A2E" }}
                >
                  {stat.value}
                </span>
                <span className="mt-1 block text-sm font-medium text-neutral-600">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onBookCall}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-lime px-8 py-3 text-sm font-bold text-[#0B0B0F] transition-all hover:bg-lime/90 hover:shadow-[0_0_30px_rgba(200,246,93,0.22)]"
          >
            Узнать больше
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
