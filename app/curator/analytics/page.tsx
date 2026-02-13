import {
  TrendingUp,
  Users,
  Trophy,
  BookOpen,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ── Mock data ──────────────────────────────────────────────────────────────────

const TOP_COURSES = [
  { title: 'Основы кибербезопасности',  category: 'IT',              score: 4.9, enrolled: 142, progress: 85, problems: 2 },
  { title: 'Эффективные переговоры',     category: 'Продажи',         score: 4.2, enrolled: 56,  progress: 42, problems: 0 },
  { title: 'Устойчивое развитие',        category: 'ESG',             score: 4.8, enrolled: 89,  progress: 94, problems: 0 },
  { title: 'Управление временем',        category: 'Soft skills',     score: 4.5, enrolled: 73,  progress: 67, problems: 1 },
  { title: 'Финансовая грамотность',     category: 'Финансы',         score: 3.8, enrolled: 34,  progress: 31, problems: 3 },
];

const WEEKLY_ACTIVITY = [
  { day: 'Пн', completions: 28, active: 47 },
  { day: 'Вт', completions: 35, active: 63 },
  { day: 'Ср', completions: 42, active: 71 },
  { day: 'Чт', completions: 31, active: 58 },
  { day: 'Пт', completions: 49, active: 84 },
  { day: 'Сб', completions: 14, active: 22 },
  { day: 'Вс', completions: 9,  active: 15 },
];

const SCORE_DISTRIBUTION = [
  { label: '5.0',  pct: 32, count: 187 },
  { label: '4.0–4.9', pct: 41, count: 239 },
  { label: '3.0–3.9', pct: 18, count: 105 },
  { label: '< 3.0',   pct: 9,  count: 52 },
];

const EMPLOYEE_GROUPS = [
  { name: 'IT-отдел',           total: 48, done: 41, score: 4.8 },
  { name: 'Продажи',            total: 87, done: 62, score: 4.1 },
  { name: 'HR',                 total: 24, done: 21, score: 4.6 },
  { name: 'Финансы',            total: 36, done: 20, score: 3.9 },
  { name: 'Административный',   total: 19, done: 16, score: 4.4 },
];

const MAX_BAR = Math.max(...WEEKLY_ACTIVITY.map((d) => d.active));

export default function AnalyticsPage() {
  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto space-y-7">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Всего сотрудников */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[13px] font-medium text-gray-500">Всего сотрудников</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffba49]/10 flex items-center justify-center">
              <Users size={15} className="text-[#c47a00]" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">843</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
              <ArrowUpRight size={10} />+12
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">за последний месяц</p>
        </div>

        {/* Завершили курсы */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[13px] font-medium text-gray-500">Завершили курсы</span>
            <div className="w-8 h-8 rounded-lg bg-[#85EB59]/10 flex items-center justify-center">
              <TrendingUp size={15} className="text-[#4a8a20]" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">612</span>
            <div className="flex-1 mb-2">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#85EB59] rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <span className="text-[13px] font-bold text-gray-700 mb-1">72%</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">из 843 сотрудников</p>
        </div>

        {/* Средний балл */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[13px] font-medium text-gray-500">Средний балл</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffba49]/10 flex items-center justify-center">
              <Trophy size={15} className="text-[#c47a00]" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">4.8</span>
            <span className="text-[11px] font-bold text-[#c47a00] bg-[#ffba49]/10 px-1.5 py-0.5 rounded mb-1">из 5</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            <span className="inline-flex items-center gap-0.5 text-green-700 font-medium">
              <ArrowUpRight size={10} />+0.3
            </span>{' '}
            с прошлого месяца
          </p>
        </div>

        {/* Среднее время */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[13px] font-medium text-gray-500">Среднее время обучения</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock size={15} className="text-blue-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">24</span>
            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mb-1">мин.</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            <span className="inline-flex items-center gap-0.5 text-red-500 font-medium">
              <ArrowDownRight size={10} />−3 мин.
            </span>{' '}
            с прошлого месяца
          </p>
        </div>
      </div>

      {/* ── Main grid: activity + distribution ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Weekly activity bar chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Активность за неделю</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Завершения и активные сессии по дням</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#85EB59]" />
                Активных
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-black" />
                Завершений
              </span>
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-3 h-44">
            {WEEKLY_ACTIVITY.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-36">
                  {/* Active bar */}
                  <div
                    className="flex-1 bg-[#85EB59]/30 rounded-t-md transition-all"
                    style={{ height: `${(d.active / MAX_BAR) * 100}%` }}
                    title={`Активных: ${d.active}`}
                  />
                  {/* Completion bar */}
                  <div
                    className="flex-1 bg-black rounded-t-md transition-all"
                    style={{ height: `${(d.completions / MAX_BAR) * 100}%` }}
                    title={`Завершений: ${d.completions}`}
                  />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score distribution */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Распределение баллов</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">По всем курсам и сотрудникам</p>
          </div>

          <div className="space-y-4">
            {SCORE_DISTRIBUTION.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-gray-700">{s.label}</span>
                  <span className="text-[12px] text-gray-400">{s.count} чел.</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.pct}%`,
                      background: s.label === '5.0' ? '#85EB59' : s.label === '4.0–4.9' ? '#3d7a10' : s.label === '3.0–3.9' ? '#ffba49' : '#f87171',
                    }}
                  />
                </div>
                <div className="text-right mt-0.5">
                  <span className="text-[11px] font-bold text-gray-500">{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[12px] text-gray-500">Средний балл</span>
            <span className="text-[14px] font-bold text-gray-900">4.8 <span className="text-[11px] font-normal text-gray-400">/ 5.0</span></span>
          </div>
        </div>
      </div>

      {/* ── Bottom grid: courses table + employee groups ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top courses table */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Курсы по результатам</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Все активные курсы с метриками</p>
            </div>
            <BookOpen size={16} className="text-gray-300" />
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Курс</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-20">Участников</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-40">Прогресс</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-20">Балл</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-28">Проблемы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TOP_COURSES.map((c) => (
                <tr key={c.title} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold text-gray-900 leading-snug">{c.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{c.category}</div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="text-[13px] font-medium text-gray-700">{c.enrolled}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#85EB59] rounded-full"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-600 w-7 text-right">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="text-[13px] font-bold text-gray-900">{c.score}</span>
                    <span className="text-[10px] text-gray-400">/5</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.problems > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
                        {c.problems} {c.problems === 1 ? 'тема' : 'темы'}
                        <AlertTriangle size={10} />
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Employee groups */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">По отделам</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Прогресс по группам сотрудников</p>
          </div>

          <div className="divide-y divide-gray-50">
            {EMPLOYEE_GROUPS.map((g) => {
              const pct = Math.round((g.done / g.total) * 100);
              return (
                <div key={g.name} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-gray-800">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{g.done}/{g.total}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: g.score >= 4.5 ? '#85EB59' : g.score >= 4.0 ? '#ffba49' : '#fecaca',
                          color: g.score >= 4.5 ? '#1a4a00' : g.score >= 4.0 ? '#7a4a00' : '#b91c1c',
                        }}
                      >
                        {g.score}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? '#85EB59' : pct >= 50 ? '#ffba49' : '#f87171',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">Прохождение</span>
                    <span className="text-[10px] font-bold text-gray-600">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center py-2">
        <p className="text-[11px] text-gray-400">
          Данные обновляются в реальном времени. Показаны демо-значения для ненастроенных API.
        </p>
      </div>

    </div>
  );
}
