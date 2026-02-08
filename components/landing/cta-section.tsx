"use client";

import { ArrowRight } from "lucide-react";

export function CtaSection({ onBookCall }: { onBookCall: () => void }) {
  return (
    <section className="relative overflow-hidden bg-[#0B0B0F] pt-12 pb-14 md:pt-16 md:pb-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] opacity-[0.14]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #C8F65D 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute right-[-10%] top-[20%] h-[520px] w-[520px] rounded-full blur-[160px] opacity-[0.10]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #7CFFB2 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-7 py-12 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur md:px-12 md:py-14">
          {/* subtle inner highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.18]"
               style={{
                 background:
                   "linear-gradient(120deg, rgba(200,246,93,0.18) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.02) 100%)",
               }}
          />

          <h2 className="relative mx-auto max-w-3xl text-balance text-3xl font-black tracking-tight leading-[1.05] text-white md:text-5xl md:leading-[1.02] lg:text-6xl">
            Хотите увидеть ADAPT на вашей базе знаний?
          </h2>

          <p className="relative mx-auto mt-4 max-w-2xl text-pretty text-sm font-medium leading-relaxed text-white/70 md:mt-5 md:text-base">
            Расскажите немного о себе — запланируйте бесплатную вводную встречу, и
            мы покажем, как ADAPT ускорит онбординг и обучение вашей команды.
          </p>

          <div className="relative mt-8 flex justify-center md:mt-10">
            <button
              onClick={onBookCall}
              type="button"
              className="group relative flex items-center gap-3 rounded-full bg-lime px-10 py-4 text-base font-bold text-[#0B0B0F]
                         shadow-[0_20px_60px_rgba(200,246,93,0.22)] transition-all
                         hover:-translate-y-0.5 hover:bg-lime/90 hover:shadow-[0_25px_80px_rgba(200,246,93,0.28)]
                         active:translate-y-0"
            >
              <span
                className="absolute inset-0 -z-10 rounded-full opacity-0 blur-xl transition-opacity group-hover:opacity-30"
                style={{ background: "#C8F65D" }}
              />
              Связаться
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
