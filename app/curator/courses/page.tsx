'use client';

import { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, BookOpen, Search, X } from 'lucide-react';
import { CourseCard } from '@/components/curator/CourseCard';
import { CreateCourseWizard } from '@/components/curator/CreateCourseWizard';
import { CourseManifest } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesPageInner />
    </Suspense>
  );
}

type StatusFilter = 'all' | 'ready' | 'processing' | 'partial' | 'error';
type SizeFilter = 'all' | 'small' | 'medium' | 'large';

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all',        label: 'Все' },
  { value: 'ready',      label: 'Готов' },
  { value: 'processing', label: 'Обработка' },
  { value: 'partial',    label: 'Частично' },
  { value: 'error',      label: 'Ошибка' },
];

const SIZE_CHIPS: { value: SizeFilter; label: string }[] = [
  { value: 'all',    label: 'Любой размер' },
  { value: 'small',  label: 'Короткий' },
  { value: 'medium', label: 'Средний' },
  { value: 'large',  label: 'Большой' },
];

function CoursesPageInner() {
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Auto-open dialog when ?new=1
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
      const data = await res.json();
      if (data.ok) {
        setCourses(data.courses as CourseManifest[]);
      } else {
        setFetchError('Не удалось загрузить курсы');
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadCourses();
  }, [userId, loadCourses]);

  const handleSuccess = (manifest: CourseManifest) => {
    setCourses((prev) => [manifest, ...prev]);
    setDialogOpen(false);
  };

  // Filtered courses
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesQuery = !debouncedQuery || c.title.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.overallStatus === statusFilter;
      const matchesSize = sizeFilter === 'all' || c.size === sizeFilter;
      return matchesQuery && matchesStatus && matchesSize;
    });
  }, [courses, debouncedQuery, statusFilter, sizeFilter]);

  const hasFilters = query !== '' || statusFilter !== 'all' || sizeFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setStatusFilter('all');
    setSizeFilter('all');
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Мои курсы</h1>
            {courses.length > 0 && (
              <span className="text-[13px] text-gray-400 font-medium">
                {courses.length} {courses.length === 1 ? 'курс' : courses.length < 5 ? 'курса' : 'курсов'}
              </span>
            )}
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-lime px-4 py-2 text-[13px] font-semibold text-[#0B0B0F] hover:brightness-95 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={14} />
            Создать курс
          </button>
        </div>

        {fetchError && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
            {fetchError}
          </div>
        )}

        {/* Search + Filters — only show when there are courses */}
        {courses.length > 0 && (
          <div className="flex flex-col gap-3 mb-5">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по названию…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
              {/* Status chips */}
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setStatusFilter(chip.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[12px] font-medium border transition-all',
                      statusFilter === chip.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 self-stretch" />

              {/* Size chips */}
              <div className="flex gap-1.5 flex-wrap">
                {SIZE_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setSizeFilter(chip.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[12px] font-medium border transition-all',
                      sizeFilter === chip.value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Reset */}
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={11} />
                  Сбросить
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty state: no courses at all */}
        {courses.length === 0 && (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-5 text-center max-w-[340px]">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-lime/10">
                <BookOpen size={28} className="text-lime" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900 mb-2">
                  У вас пока нет курсов
                </h2>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Загрузите файлы из вашей базы знаний — регламенты, инструкции,
                  документы. Мы автоматически извлечём текст.
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-[13px] font-semibold text-[#0B0B0F] hover:brightness-95 transition shadow-sm"
              >
                <Plus size={14} />
                Создать первый курс
              </button>
            </div>
          </div>
        )}

        {/* Empty state: filters found nothing */}
        {courses.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Search size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-gray-700">Ничего не найдено</p>
              <p className="text-[13px] text-gray-400 mt-1">Попробуйте другой запрос или сбросьте фильтры</p>
            </div>
            <button
              onClick={resetFilters}
              className="text-[13px] font-medium text-lime hover:brightness-90 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        )}

        {/* Course grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>

      <CreateCourseWizard
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
