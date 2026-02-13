'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export function CourseCodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setError('Введите корректный код курса');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/by-code/${trimmed}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? 'Курс с таким кодом не найден');
      }
      const courseId = data.manifest?.courseId;
      if (!courseId) throw new Error('Не удалось получить ID курса');
      // Pass code as query param so the course page can reload without needing auth
      router.push(`/employee/course/${courseId}?code=${trimmed}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при поиске курса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="max-w-sm mx-auto">
        <div className="w-16 h-16 bg-lime/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔑</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          Введите код курса
        </h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Куратор должен прислать вам 6-значный код. Введите его ниже.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            placeholder="Например: AB12CD"
            maxLength={8}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg font-mono font-semibold tracking-widest text-gray-900 placeholder-gray-300 uppercase focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0F0F14] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Ищем курс...</>
            ) : (
              <>Открыть курс <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
