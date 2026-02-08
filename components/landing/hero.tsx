"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero({ onBookCall }: { onBookCall: () => void }) {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[#0B0B0F] py-20 pt-32 md:py-28 md:pt-44"
    >

      {/* Ambient orbs */}
<div className="pointer-events-none absolute -z-10 inset-0">
  <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] opacity-[0.12]"
       style={{ background: "radial-gradient(circle at 30% 30%, #C8F65D 0%, transparent 60%)" }} />
  <div className="absolute left-[15%] top-[15%] h-[520px] w-[520px] rounded-full blur-[140px] opacity-[0.10]"
       style={{ background: "radial-gradient(circle at 30% 30%, #7CFFB2 0%, transparent 60%)" }} />
  <div className="absolute right-[10%] bottom-[10%] h-[520px] w-[520px] rounded-full blur-[160px] opacity-[0.10]"
       style={{ background: "radial-gradient(circle at 30% 30%, #5D8BFF 0%, transparent 60%)" }} />
</div>

{/* Subtle grid */}
<div
  className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10]"
  style={{
    backgroundImage:
      "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 70%)",
  }}
/>

      {/* Subtle glow — behind content */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-[150px]"
        style={{ background: "#C8F65D" }}
      />

      {/* Floating badges - closer to center, Russian labels */}
      <div className="animate-float pointer-events-none absolute left-[30%] top-[25%] z-[1] hidden rounded-xl bg-lime/90 px-3 py-1.5 text-xs font-bold text-[#0B0B0F] opacity-90 shadow-lg xl:block">
        База знаний
      </div>
      <div className="animate-float-alt pointer-events-none absolute right-[37%] top-[28%] z-[1] hidden rounded-xl bg-pastel-purple px-3 py-1.5 text-xs font-bold text-purple-900 opacity-90 shadow-lg xl:block">
        Квизы
      </div>
      <div className="animate-float pointer-events-none absolute left-[24%] bottom-[30%] z-[1] hidden rounded-xl bg-pastel-blue px-3 py-1.5 text-xs font-bold text-blue-900 opacity-90 shadow-lg xl:block">
        Аттестация
      </div>
      <div className="animate-float-alt pointer-events-none absolute right-[31%] bottom-[25%] z-[1] hidden rounded-xl bg-pastel-yellow px-3 py-1.5 text-xs font-bold text-yellow-900 opacity-90 shadow-lg xl:block">
        Аналитика
      </div>

      {/* Content — z-2 */}
      <div className="relative z-[2] mx-auto max-w-[980px] px-5 text-center md:px-8">
        {/* Badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full  text-xs font-medium tracking-wide text-[#E85D3A]">
        </div>

        {/* H1 — no uppercase, readable */}
        <h1 className="text-balance text-5xl font-black tracking-tight leading-[1.05] text-white md:text-7xl md:leading-[1.02]">
  Обучение по вашей базе знаний{" "}
  <span className="bg-gradient-to-r from-[#C8F65D] via-[#E8FFA6] to-white bg-clip-text text-transparent">
    за минуты
  </span>
  , а не часы.
</h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-[720px] text-base leading-relaxed text-zinc-300 md:text-lg">
          Загрузите регламенты и презентации — ADAPT автоматически соберёт тренинги и квизы для ваших сотрудников.
        </p>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
  <button
    onClick={onBookCall}
    type="button"
    className="group relative flex items-center gap-3 rounded-full bg-[#C8F65D] px-10 py-4 text-base font-bold text-[#0B0B0F]
               shadow-[0_20px_60px_rgba(200,246,93,0.22)] transition-all hover:translate-y-[-1px]
               hover:shadow-[0_25px_80px_rgba(200,246,93,0.28)] active:translate-y-0"
  >
    <span className="absolute inset-0 -z-10 rounded-full opacity-0 blur-xl transition-opacity group-hover:opacity-30"
          style={{ background: "#C8F65D" }} />
    Записаться на демо
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </button>

  <Link
    href="/auth"
    className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white/80
               backdrop-blur transition-all hover:border-white/30 hover:bg-white/10"
  >
    Войти
  </Link>
</div>
      </div>
    </section>
  );
}
