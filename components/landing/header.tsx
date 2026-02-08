"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Главная", href: "#home" },
  { label: "О нас", href: "#about" },
  { label: "Отзывы", href: "#reviews" },
];

export function Header({ onBookCall }: { onBookCall: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0F]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-sm font-extrabold text-[#0B0B0F]">
            A
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            ADAPT
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth"
            className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
          >
            Войти
          </Link>
          <button
            onClick={onBookCall}
            type="button"
            className="rounded-full bg-lime px-7 py-2.5 text-sm font-bold text-[#0B0B0F] transition-all hover:bg-lime/90 hover:shadow-[0_0_24px_rgba(200,246,93,0.25)]"
          >
            Записаться на демо
          </button>
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white md:hidden"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0B0B0F] md:hidden">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Войти
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onBookCall();
              }}
              className="mt-3 rounded-full bg-lime px-6 py-3 text-sm font-bold text-[#0B0B0F]"
            >
              Записаться на демо
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
