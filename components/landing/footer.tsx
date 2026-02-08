import Link from "next/link";

const mainLinks = [
  { label: "Главная", href: "#" },
  { label: "О нас", href: "#about" },
  { label: "Услуги", href: "#services" },
  { label: "Отзывы", href: "#testimonials" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0B0F]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Top */}
        <div className="py-12 md:py-14">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-sm font-black text-[#0B0B0F] shadow-[0_0_30px_rgba(200,246,93,0.18)]">
                  A
                </span>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  ADAPT
                </span>
              </Link>

              <p className="max-w-sm text-sm font-medium leading-relaxed text-white/55">
                AI-платформа для онбординга и обучения сотрудников из базы знаний
                компании.
              </p>
            </div>

            {/* Links */}
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-white/35">
                  Навигация
                </p>
                <ul className="flex flex-col gap-2.5">
                  {mainLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-white/35">
                  Контакты
                </p>
                <ul className="flex flex-col gap-2.5">
                  <li>
                    <a
                      href="https://t.me/IarslanT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                    >
                      Telegram
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@adapt.ai"
                      className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                    >
                      hello@adapt-ai.ru
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <span className="font-medium">© 2026 ADAPT. Все права защищены.</span>
          <span className="font-medium">
            Designed & Developed by{" "}
            <span className="text-white/55">ADAPT Team</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
