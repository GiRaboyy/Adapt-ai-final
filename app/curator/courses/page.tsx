'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { CourseCard } from '@/components/curator/CourseCard';
import { CreateCourseDialog } from '@/components/curator/CreateCourseDialog';
import { CourseManifest } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

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

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Курсы</h1>
          {courses.length > 0 && (
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-semibold text-[#0F0F14] hover:brightness-95 transition shadow-sm"
            >
              <Plus size={15} />
              Создать курс
            </button>
          )}
        </div>

        {fetchError && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {fetchError}
          </div>
        )}

        {/* Empty state */}
        {courses.length === 0 && !loading && (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-lime/10">
                <BookOpen size={28} className="text-lime" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Создайте первый курс
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Загрузите файлы из вашей базы знаний — регламенты, инструкции,
                  документы. Мы автоматически извлечём текст.
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-semibold text-[#0F0F14] hover:brightness-95 transition shadow-sm"
              >
                <Plus size={15} />
                Создать курс
              </button>
            </div>
          </div>
        )}

        {/* Course grid */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}
      </div>

      {userId && (
        <CreateCourseDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleSuccess}
          userId={userId}
        />
      )}
    </>
  );
}
