import { BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-8">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3F3F8]">
          <BarChart2 size={28} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Аналитика</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Скоро здесь появится аналитика: прогресс сотрудников,
            статистика прохождения курсов и показатели эффективности.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-lime/10 px-3 py-1 text-xs font-medium text-lime">
          В разработке
        </span>
      </div>
    </div>
  );
}
