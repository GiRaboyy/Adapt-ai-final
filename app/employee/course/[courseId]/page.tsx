'use client';

/**
 * Employee course view page.
 * Reads courseId from URL, fetches course via /api/courses/by-code or
 * directly via /api/courses/{id} — we try the direct endpoint first (works
 * because the manifest is public via service_role on backend), then fall back
 * to by-code if the client has a ?code= param.
 *
 * Route: /employee/course/[courseId]?code=XXX
 */

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, BookOpen, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { CourseManifest, Question } from '@/lib/types';
import { cn } from '@/lib/utils';

const SIZE_LABELS: Record<string, string> = {
  small: 'Короткий', medium: 'Средний', large: 'Большой',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch { return '—'; }
}

// ─── Question view (read-only) ────────────────────────────────────────────────

function QuestionView({ question, index }: { question: Question; index: number }) {
  const isQuiz = question.type === 'quiz';

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-2 mb-3">
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            isQuiz ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          )}
        >
          {isQuiz ? 'Quiz' : 'Open'}
        </span>
        <span className="text-xs text-gray-400 mt-0.5">#{index + 1}</span>
      </div>

      <p className="text-[14px] font-medium text-gray-900 mb-3 leading-relaxed">{question.prompt}</p>

      {isQuiz && question.quizOptions && (
        <div className="flex flex-col gap-1.5">
          {question.quizOptions.map((opt, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              {opt}
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-1">Выберите один вариант ответа</p>
        </div>
      )}

      {!isQuiz && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <textarea
            readOnly
            placeholder="Ваш ответ..."
            rows={3}
            className="w-full bg-transparent text-sm text-gray-600 placeholder-gray-400 resize-none focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmployeeCoursePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    }>
      <EmployeeCoursePageInner />
    </Suspense>
  );
}

function EmployeeCoursePageInner() {
  const { courseId } = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;

    const code = searchParams.get('code');

    const fetchManifest = async () => {
      setLoading(true);
      setError('');
      try {
        // Use code query param if available, otherwise try courseId as code
        const lookupCode = code ?? courseId;
        const url = `/api/courses/by-code/${lookupCode}`;

        const res = await fetch(url);
        const data = await res.json();

        // If by-code fails, the courseId itself might be the actual courseId (not a code)
        // In that case, we can't fetch without auth. Show a helpful error.
        if (!res.ok || !data.ok) {
          throw new Error(data.detail ?? 'Курс не найден. Проверьте код или ссылку.');
        }

        setManifest(data.manifest as CourseManifest);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки курса');
      } finally {
        setLoading(false);
      }
    };

    fetchManifest();
  }, [courseId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Загружаем курс...</p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">Курс не найден</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            ← Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const questions: Question[] = manifest.questions ?? [];
  const quizCount = questions.filter((q) => q.type === 'quiz').length;
  const openCount = questions.filter((q) => q.type === 'open').length;

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Назад
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-lime/15 flex items-center justify-center shrink-0">
              <span className="font-bold text-xs text-[#0F0F14]">A</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">{manifest.title}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Course card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-semibold text-[#3d6000]">
              {SIZE_LABELS[manifest.size] ?? manifest.size}
            </span>
            {manifest.inviteCode && (
              <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-mono text-gray-500">
                {manifest.inviteCode}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{manifest.title}</h1>
          <p className="text-xs text-gray-400">{formatDate(manifest.createdAt)}</p>

          {/* Stats */}
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <BookOpen size={12} />
              {questions.length} вопрос{questions.length === 1 ? '' : questions.length < 5 ? 'а' : 'ов'}
            </div>
            {quizCount > 0 && (
              <div className="text-xs text-blue-500">{quizCount} quiz</div>
            )}
            {openCount > 0 && (
              <div className="text-xs text-purple-500">{openCount} open</div>
            )}
          </div>
        </div>

        {/* Questions */}
        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-lime/10 flex items-center justify-center">
              <BookOpen size={20} className="text-lime" />
            </div>
            <p className="font-semibold text-gray-800">Вопросы ещё не добавлены</p>
            <p className="text-sm text-gray-400">Куратор пока не создал тренинг для этого курса</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600 px-1">Вопросы тренинга</p>
            <div className="flex flex-col gap-3">
              {questions.map((q, idx) => (
                <QuestionView key={q.id} question={q} index={idx} />
              ))}
            </div>

            {/* Completion stub */}
            <div className="rounded-2xl border border-lime/30 bg-lime/5 p-5 text-center mt-2">
              <CheckCircle2 size={24} className="text-lime mx-auto mb-2" />
              <p className="font-semibold text-gray-900 text-sm">Вы ознакомились со всеми вопросами</p>
              <p className="text-xs text-gray-500 mt-1">
                Интерактивное прохождение будет доступно в следующем обновлении
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
