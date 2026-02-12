'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  BarChart2,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/curator/courses', label: 'Мои курсы', icon: <BookOpen size={18} /> },
  { href: '/curator/analytics', label: 'Аналитика', icon: <BarChart2 size={18} /> },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#0F0F14] text-white transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[64px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 overflow-hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-lime shrink-0">
          <span className="text-[#0F0F14] font-bold text-xs leading-none">A</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-[15px] tracking-wide whitespace-nowrap overflow-hidden">
            ADAPT
          </span>
        )}
      </div>

      <div className="mx-4 h-px bg-white/[0.06] mb-3" />

      {/* Create Course button */}
      <div className="px-2 mb-2">
        <Tooltip label="Создать курс" disabled={!collapsed}>
          <button
            onClick={() => router.push('/curator/courses?new=1')}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-xl bg-lime text-[#0F0F14] font-semibold text-sm hover:brightness-95 transition-all shadow-sm',
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <Plus size={16} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Создать курс</span>}
          </button>
        </Tooltip>
      </div>

      <div className="mx-4 h-px bg-white/[0.06] mb-2" />

      {/* Main Nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Tooltip key={item.href} label={item.label} disabled={!collapsed}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors relative',
                  isActive
                    ? 'bg-lime/10 text-lime'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <span className={cn('shrink-0', isActive ? 'text-lime' : '')}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                )}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom: Profile */}
      <div className="px-2 pb-4">
        <div className="mx-2 h-px bg-white/[0.06] mb-3" />
        <Tooltip label="Профиль" disabled={!collapsed}>
          <Link
            href="/curator/profile"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              pathname === '/curator/profile'
                ? 'bg-lime/10 text-lime'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <span className="shrink-0">
              <User size={18} />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                Профиль
              </span>
            )}
          </Link>
        </Tooltip>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1C1C24] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors shadow-md"
        aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

// ─── Simple CSS tooltip ────────────────────────────────────────────────────────

function Tooltip({
  children,
  label,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
}) {
  if (disabled) return <>{children}</>;
  return (
    <div className="relative group/tooltip">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-lg bg-[#1C1C24] border border-white/10 px-2.5 py-1.5 text-xs text-white shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150">
        {label}
      </span>
    </div>
  );
}
