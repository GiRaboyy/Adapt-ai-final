'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  Settings,
  BookOpen,
  Users,
  HelpCircle,
  Plus,
  Upload,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Дашборд',  href: '/curator/courses' },
  { icon: BookOpen,        label: 'Курсы',     href: '/curator/courses' },
  { icon: BarChart2,       label: 'Аналитика', href: '/curator/analytics' },
  { icon: Users,           label: 'Сотрудники',href: '#' },
  { icon: Settings,        label: 'Настройки', href: '/curator/profile' },
  { icon: HelpCircle,      label: 'Помощь',    href: '#' },
];

interface MenuOverlayProps {
  onClose: () => void;
  onCreateCourse: () => void;
}

export function MenuOverlay({ onClose, onCreateCourse }: MenuOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (href: string) => {
    if (href !== '#') router.push(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-16 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute top-16 left-0 w-full bg-white z-[45] border-b border-black/5 shadow-2xl">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-10">

            {/* Navigation grid */}
            <div className="col-span-8 border-r border-gray-100 pr-10">
              <nav className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
                  const isActive =
                    href !== '#' && pathname.startsWith(href);
                  return (
                    <button
                      key={label}
                      onClick={() => navigate(href)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                        isActive
                          ? 'bg-[#85EB59]/15 text-black font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                      )}
                    >
                      <Icon
                        size={18}
                        className={isActive ? 'text-black' : 'text-gray-400'}
                      />
                      <span className="text-[14px]">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick actions */}
            <div className="col-span-4 flex flex-col gap-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Быстрые действия
              </h3>

              <button
                onClick={() => {
                  onCreateCourse();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#85EB59] text-black font-bold py-3.5 rounded-xl hover:brightness-95 active:scale-[0.98] transition shadow-[0_4px_16px_rgba(133,235,89,0.35)]"
              >
                <Plus size={18} />
                Создать курс
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition text-[12px] text-gray-600 font-medium leading-snug text-center">
                  <Upload size={18} className="text-gray-400" />
                  Импортировать файлы
                </button>
                <button
                  onClick={() => navigate('/curator/analytics')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition text-[12px] text-gray-600 font-medium leading-snug text-center"
                >
                  <Download size={18} className="text-gray-400" />
                  Скачать отчёт
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
