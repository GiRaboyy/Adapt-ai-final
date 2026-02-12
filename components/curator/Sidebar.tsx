'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  BarChart2,
  User,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
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
        'flex flex-col h-screen bg-[#0B0B0F] text-white transition-[width] duration-200 ease-in-out shrink-0 overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo row + collapse button */}
      <div className="flex items-center px-3 py-4 gap-2 overflow-hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-lime shrink-0">
          <span className="text-[#0B0B0F] font-bold text-[13px] leading-none tracking-tight">A</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-[14px] tracking-widest whitespace-nowrap flex-1 overflow-hidden text-white/90">
            ADAPT
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors shrink-0',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed
            ? <PanelLeftOpen size={16} />
            : <PanelLeftClose size={16} />
          }
        </button>
      </div>

      <div className="mx-3 h-px bg-white/[0.07] mb-3" />

      {/* Create Course button */}
      <div className="px-2 mb-2">
        <Tooltip label="Создать курс" disabled={!collapsed}>
          <button
            onClick={() => router.push('/curator/courses?new=1')}
            className={cn(
              'flex items-center gap-2 w-full rounded-xl bg-lime text-[#0B0B0F] font-semibold text-[13px] hover:brightness-95 active:scale-[0.98] transition-all',
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <Plus size={15} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Создать курс</span>}
          </button>
        </Tooltip>
      </div>

      <div className="mx-3 h-px bg-white/[0.07] mb-2" />

      {/* Main Nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Tooltip key={item.href} label={item.label} disabled={!collapsed}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-lime/[0.12] text-lime'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]'
                )}
              >
                <span className={cn('shrink-0', isActive ? 'text-lime' : '')}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
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
        <div className="mx-1 h-px bg-white/[0.07] mb-2" />
        <Tooltip label="Профиль" disabled={!collapsed}>
          <Link
            href="/curator/profile"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
              collapsed && 'justify-center px-0',
              pathname === '/curator/profile'
                ? 'bg-lime/[0.12] text-lime'
                : 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]'
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
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-lg bg-[#1C1C26] border border-white/10 px-2.5 py-1.5 text-xs text-white/90 shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150">
        {label}
      </span>
    </div>
  );
}
