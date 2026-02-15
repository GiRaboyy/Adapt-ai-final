'use client';

import { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  X,
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { CreateCourseWizard } from '@/components/curator/CreateCourseWizard';
import { CourseManifest } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { apiFetch, safeJson } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesPageInner />
    </Suspense>
  );
}

type StatusFilter = 'all' | 'ready' | 'draft';

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all',   label: 'Все' },
  { value: 'ready', label: 'Опубликован' },
  { value: 'draft', label: 'Черновик' },
];

// Deterministic mock data per course
function getCourseStats(courseId: string) {
  let h = 0;
  for (let i = 0; i < courseId.length; i++) {
    h = ((h << 5) - h + courseId.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(h);
  const progress = 30 + (abs % 65);           // 30–95%
  const score = (3.5 + (abs % 16) / 10).toFixed(1); // 3.5–5.0
  const problems = abs % 5 === 0 ? 2 + (abs % 3) : 0;
  return { progress, score, problems };
}

const COVER_COLORS = [
  { bg: 'bg-[#85EB59]/10', text: 'text-black' },
  { bg: 'bg-[#FFBA49]/10', text: 'text-black' },
  { bg: 'bg-gray-100',     text: 'text-gray-600' },
  { bg: 'bg-[#85EB59]/15', text: 'text-black' },
  { bg: 'bg-[#FFBA49]/15', text: 'text-black' },
  { bg: 'bg-gray-200',     text: 'text-gray-700' },
  { bg: 'bg-[#85EB59]/20', text: 'text-black' },
];

const COVER_ICONS = ['📚', '🤝', '🧠', '🌿', '💻', '📊', '🎯'];

function getCoverIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % COVER_COLORS.length;
}

function formatUpdated(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Только что';
    if (diffH < 24) return `${diffH} ч. назад`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Вчера';
    if (diffD < 7) return `${diffD} дн. назад`;
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return '—';
  }
}

const PAGE_SIZE = 8;

function CoursesPageInner() {
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDialogOpen(true);
      router.replace('/curator/courses');
    }
  }, [searchParams, router]);

  const loadCourses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setFetchError('');
    try {
      const res = await apiFetch('/api/courses/list');
      const data = await safeJson<{ ok: boolean; courses: CourseManifest[] }>(res);
      if (data.ok) setCourses(data.courses);
      else setFetchError('Не удалось загрузить курсы');
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId) loadCourses(); }, [userId, loadCourses]);

  const handleSuccess = (manifest: CourseManifest) => {
    setCourses((prev) => [manifest, ...prev]);
    setDialogOpen(false);
  };

  // ── KPI stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = courses.filter((c) => c.overallStatus === 'ready').length;
    const assigned = courses.reduce((s, c) => s + (c.employeesCount ?? 0), 0);
    const completed = Math.round(assigned * 0.72);
    const completedPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    const scores = courses
      .filter((c) => c.overallStatus === 'ready')
      .map((c) => parseFloat(getCourseStats(c.courseId).score));
    const avgScore = scores.length
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '—';
    return { active, assigned, completed, completedPct, avgScore };
  }, [courses]);

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchQ = !debouncedQuery || c.title.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchS =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && c.overallStatus === 'ready') ||
        (statusFilter === 'draft' && c.overallStatus !== 'ready');
      return matchQ && matchS;
    });
  }, [courses, debouncedQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-[480px] rounded-xl" />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (courses.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-5 text-center max-w-[340px]">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#85EB59]/10">
              <BookOpen size={28} className="text-[#85EB59]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900 mb-2">У вас пока нет курсов</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Загрузите файлы из вашей базы знаний — регламенты, инструкции, документы.
              </p>
            </div>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#85EB59] px-5 py-2.5 text-[13px] font-semibold text-black hover:brightness-95 transition shadow-sm"
            >
              <Plus size={14} />
              Создать первый курс
            </button>
          </div>
        </div>
        <CreateCourseWizard open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={handleSuccess} userId={userId!} />
      </>
    );
  }

  return (
    <>
      <div className="px-8 py-7 max-w-[1400px] mx-auto space-y-7">

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Активных курсов */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-500">Активных курсов</span>
              <div className="w-8 h-8 rounded-lg bg-[#85EB59]/10 flex items-center justify-center">
                <BookOpen size={15} className="text-black" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                {stats.active}
              </span>
              {courses.length > stats.active && (
                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mb-1">
                  из {courses.length}
                </span>
              )}
            </div>
          </div>

          {/* Назначено сотрудникам */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-500">Назначено сотрудникам</span>
              <div className="w-8 h-8 rounded-lg bg-[#ffba49]/10 flex items-center justify-center">
                <Users size={15} className="text-[#c47a00]" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                {stats.assigned}
              </span>
              <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mb-1">
                Всего
              </span>
            </div>
          </div>

          {/* Прошли обучение */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-500">Прошли обучение</span>
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <TrendingUp size={15} className="text-gray-600" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                {stats.completed}
              </span>
              <div className="flex-1 mb-2">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#85EB59] rounded-full transition-all"
                    style={{ width: `${stats.completedPct}%` }}
                  />
                </div>
              </div>
              <span className="text-[13px] font-bold text-gray-700 mb-1">
                {stats.completedPct}%
              </span>
            </div>
          </div>

          {/* Средний результат */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-500">Средний результат</span>
              <div className="w-8 h-8 rounded-lg bg-[#ffba49]/10 flex items-center justify-center">
                <Trophy size={15} className="text-[#c47a00]" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[38px] font-bold tracking-tight text-gray-900 leading-none">
                {stats.avgScore}
              </span>
              <span className="text-[11px] font-bold text-[#c47a00] bg-[#ffba49]/10 px-1.5 py-0.5 rounded mb-1">
                из 5
              </span>
            </div>
          </div>
        </div>

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

          {/* Table header bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-gray-900 shrink-0">Курсы</h2>
              <div className="h-5 w-px bg-gray-200 hidden sm:block shrink-0" />

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Поиск курса..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-[#85EB59]/60 focus:border-[#85EB59]/60 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status filter chips */}
              <div className="hidden lg:flex items-center gap-1.5">
                {STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => { setStatusFilter(chip.value); setPage(1); }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors',
                      statusFilter === chip.value
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 bg-[#85EB59] text-black font-semibold text-[13px] px-4 py-2.5 rounded-xl hover:brightness-95 active:scale-[0.98] transition shadow-[0_4px_12px_rgba(133,235,89,0.3)] shrink-0"
            >
              <Plus size={15} />
              Создать курс
            </button>
          </div>

          {fetchError && (
            <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
              {fetchError}
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Название курса
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">
                      Статус
                    </th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-28">
                      Назначено
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-44">
                      Прогресс
                    </th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-36">
                      Ср. результат
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-40">
                      Проблемные темы
                    </th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">
                      Обновлён
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((course) => {
                    const isReady = course.overallStatus === 'ready';
                    const coverIdx = getCoverIndex(course.courseId);
                    const { bg } = COVER_COLORS[coverIdx];
                    const icon = COVER_ICONS[coverIdx];
                    const { progress, score, problems } = getCourseStats(course.courseId);
                    const assigned = course.employeesCount ?? 0;

                    return (
                      <tr
                        key={course.courseId}
                        onClick={() => router.push(`/curator/courses/${course.courseId}`)}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                      >
                        {/* Course name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0', bg)}>
                              {icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-gray-900 group-hover:text-black transition-colors truncate max-w-[260px]">
                                {course.title}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <button
                                  onClick={(e) => copyCode(e, course.inviteCode ?? '')}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Скопировать код"
                                >
                                  <Copy size={9} />
                                  {copied === course.inviteCode ? 'Скопировано!' : (course.inviteCode ?? '——')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {isReady ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#85EB59]/15 text-black border border-[#85EB59]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#85EB59]" />
                              Активен
                            </span>
                          ) : course.overallStatus === 'processing' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FFBA49]/15 text-black border border-[#FFBA49]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FFBA49] animate-pulse" />
                              Обработка
                            </span>
                          ) : course.overallStatus === 'error' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                              Ошибка
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Черновик
                            </span>
                          )}
                        </td>

                        {/* Назначено */}
                        <td className="px-4 py-4 text-center">
                          {isReady ? (
                            <span className="text-[13px] font-medium text-gray-700">{assigned}</span>
                          ) : (
                            <span className="text-[13px] text-gray-400">—</span>
                          )}
                        </td>

                        {/* Прогресс */}
                        <td className="px-4 py-4">
                          {isReady && assigned > 0 ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#85EB59] rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-gray-700 w-8 text-right">
                                {progress}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-gray-400">Нет данных</span>
                          )}
                        </td>

                        {/* Ср. результат */}
                        <td className="px-4 py-4 text-center">
                          {isReady && assigned > 0 ? (
                            <span>
                              <span className="text-[13px] font-bold text-gray-900">{score}</span>
                              <span className="text-[11px] text-gray-400">/5</span>
                            </span>
                          ) : (
                            <span className="text-[13px] text-gray-400">—</span>
                          )}
                        </td>

                        {/* Проблемные темы */}
                        <td className="px-4 py-4">
                          {problems > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFBA49]/15 text-black border border-[#FFBA49]/30">
                              {problems} {problems === 1 ? 'тема' : 'темы'}
                              <AlertTriangle size={11} />
                            </span>
                          ) : (
                            <span className="text-[13px] text-gray-400">—</span>
                          )}
                        </td>

                        {/* Обновлён */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-[12px] text-gray-400">
                            {formatUpdated(course.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty filtered state */
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Search size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-gray-700">Ничего не найдено</p>
                <p className="text-[13px] text-gray-400 mt-1">Попробуйте другой запрос или сбросьте фильтры</p>
              </div>
              <button
                onClick={() => { setQuery(''); setStatusFilter('all'); }}
                className="text-[13px] font-medium text-[#3d7a10] hover:underline"
              >
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-gray-400">
                Показано {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(page * PAGE_SIZE, filtered.length)} из {filtered.length} курсов
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-[13px]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors',
                          page === p
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <CreateCourseWizard
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
        userId={userId!}
      />
    </>
  );
}
