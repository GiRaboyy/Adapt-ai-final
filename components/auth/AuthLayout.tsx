'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center shadow-[0_0_20px_rgba(200,246,93,0.15)]">
      <span className="font-display font-bold text-lime text-xl">A</span>
    </div>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  showMenu?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  paths: string[]; // paths that should highlight this item
}

const navItems: NavItem[] = [
  { href: '/auth', label: 'Вход', paths: ['/auth'] },
  { href: '/auth?tab=signup', label: 'Регистрация', paths: [] },
  { href: '/auth/forgot', label: 'Забыли пароль', paths: ['/auth/forgot', '/auth/reset'] },
];

export function AuthLayout({ children, showMenu = true }: AuthLayoutProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    return item.paths.includes(pathname);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-[300px] xl:w-[320px] bg-dark-bg flex-col relative overflow-hidden">
        {/* Noise overlay */}
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-8">
          {/* Logo */}
          <div className="mb-12">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark />
              <span className="font-display text-xl font-bold text-white">Adapt</span>
            </Link>
          </div>

          {/* Navigation */}
          {showMenu && (
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item)
                      ? 'bg-lime/15 text-lime border border-lime/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Footer */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-xs text-gray-500">
              © 2024 Adapt. Все права защищены.
            </p>
            <a 
              href="mailto:support@adapt-ai.ru" 
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Поддержка
            </a>
          </div>
        </div>

        {/* Gradient blob */}
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-lime/20 via-lime/5 to-transparent blur-[80px] pointer-events-none" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-dark-bg px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-lg font-bold text-white">Adapt</span>
          </Link>
          {showMenu && (
            <div className="flex items-center gap-4">
              <Link 
                href="/auth" 
                className={`text-sm font-medium ${pathname === '/auth' ? 'text-lime' : 'text-gray-400'}`}
              >
                Вход
              </Link>
              <Link 
                href="/auth/forgot" 
                className={`text-sm font-medium ${pathname.includes('forgot') || pathname.includes('reset') ? 'text-lime' : 'text-gray-400'}`}
              >
                Забыли пароль
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9] min-h-[calc(100vh-64px)] lg:min-h-screen">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </div>
    </div>
  );
}
