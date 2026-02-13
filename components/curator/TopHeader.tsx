'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/curator/courses': 'Дашборд',
  '/curator/analytics': 'Аналитика',
  '/curator/profile': 'Профиль',
};

interface TopHeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export function TopHeader({ onMenuToggle, menuOpen }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [initials, setInitials] = useState('');

  // Match on prefix for nested routes like /curator/courses/[id]
  const title =
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    'Дашборд';

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      const name: string = meta?.full_name ?? meta?.name ?? data.user?.email ?? '';
      setUserName(name);
      const parts = name.split(/[\s@]+/);
      setInitials(
        parts
          .slice(0, 2)
          .map((p) => p[0] ?? '')
          .join('')
          .toUpperCase()
      );
    });
  }, []);

  const displayName = userName
    ? userName.split(' ').slice(0, 2).join(' ')
    : 'Куратор';

  return (
    <header className="bg-black text-white h-16 flex items-center justify-between px-6 shrink-0 z-50 shadow-md">
      {/* Left: Logo + divider + page title */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => router.push('/curator/courses')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-[#85EB59] rounded flex items-center justify-center shrink-0">
            <Zap size={16} className="text-black fill-black" />
          </div>
          <span className="font-bold text-[18px] tracking-tight italic">ADAPT</span>
        </button>

        <div className="h-5 w-px bg-white/20" />
        <h1 className="text-[14px] font-medium text-white/80">{title}</h1>
      </div>

      {/* Right: Меню + user */}
      <div className="flex items-center gap-5">
        <button
          onClick={onMenuToggle}
          className="flex items-center gap-2 text-[13px] text-gray-300 hover:text-white transition-colors group"
        >
          <LayoutGrid
            size={17}
            className={
              menuOpen ? 'text-[#85EB59]' : 'group-hover:text-[#85EB59] transition-colors'
            }
          />
          <span>Меню</span>
        </button>

        <div className="h-5 w-px bg-white/20" />

        {/* User */}
        <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-gray-400 leading-none mb-0.5">Администратор</div>
            <div className="text-[12px] font-medium leading-none">{displayName}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#333] flex items-center justify-center text-white font-bold text-[11px] shrink-0">
            {initials || 'К'}
          </div>
        </div>
      </div>
    </header>
  );
}
