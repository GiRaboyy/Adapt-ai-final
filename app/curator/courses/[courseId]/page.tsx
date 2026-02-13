'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Copy,
  Download,
  Users,
  Files,
  BarChart2,
  BookOpen,
  Loader2,
  FileText,
  File,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { CourseManifest, CourseManifestFile, Question } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SIZE_LABELS: Record<string, string> = {
  small: 'Короткий',
  medium: 'Средний',
  large: 'Большой',
};

const STATUS_COLORS: Record<string, string> = {
  ready:      'bg-[#C8F65D]/20 text-[#3d6000]',
  partial:    'bg-orange-100 text-orange-700',
  error:      'bg-red-100 text-red-600',
  processing: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  ready:      'Готов',
  partial:    'Частично',
  error:      'Ошибка',
  processing: 'Обработка',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(iso));
  } catch { return '—'; }
}

function fileIcon(name: string) {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return <FileText size={15} className="text-red-400 shrink-0" />;
  if (ext === 'docx' || ext === 'doc') return <FileText size={15} className="text-blue-400 shrink-0" />;
  return <File size={15} className="text-gray-400 shrink-0" />;
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'training' | 'employees' | 'analytics' | 'materials';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'training',  label: 'Тренинг',     icon: <BookOpen size={14} /> },
  { id: 'employees', label: 'Сотрудники',  icon: <Users size={14} /> },
  { id: 'analytics', label: 'Аналитика',   icon: <BarChart2 size={14} /> },
  { id: 'materials', label: 'Материалы',   icon: <Files size={14} /> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('training');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    apiFetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setManifest(data.manifest as CourseManifest);
        else setError('Курс не найден');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const copyCode = () => {
    if (!manifest?.inviteCode) return;
    navigator.clipboard.writeText(manifest.inviteCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1800);
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-6">
        <Skeleton className="h-4 w-36 rounded-lg mb-6" />
        <Skeleton className="h-8 w-72 rounded-xl mb-3" />
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-80 rounded-xl mb-6" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <p className="text-[15px] text-gray-600">{error || 'Курс не найден'}</p>
        <button
          onClick={() => router.push('/curator/courses')}
          className="text-[13px] font-medium text-lime hover:brightness-90 transition-colors"
        >
          ← Вернуться к курсам
        </button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[manifest.overallStatus] ?? STATUS_COLORS.error;
  const statusLabel = STATUS_LABELS[manifest.overallStatus] ?? 'Ошибка';
  const sizeLabel = SIZE_LABELS[manifest.size] ?? manifest.size;

  return (
    <div className="max-w-[960px] mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/curator/courses')}
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors mb-5"
      >
        <ChevronLeft size={14} />
        Мои курсы
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', statusColor)}>
                {statusLabel}
              </span>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
                {sizeLabel}
              </span>
            </div>
            <h1 className="text-[20px] font-bold text-gray-900 leading-tight mb-4">
              {manifest.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <Files size={13} className="text-gray-400" />
                {manifest.files.length} {manifest.files.length === 1 ? 'файл' : manifest.files.length < 5 ? 'файла' : 'файлов'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                {manifest.employeesCount ?? 0} сотрудников
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                {formatDate(manifest.createdAt)}
              </span>
            </div>
          </div>

          {/* Invite code */}
          <button
            onClick={copyCode}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-[12px] font-mono text-gray-600 hover:bg-lime/10 hover:border-lime/30 hover:text-[#0B0B0F] transition-colors shadow-sm shrink-0"
            title="Скопировать код для сотрудников"
          >
            <Copy size={12} />
            {codeCopied ? 'Скопировано!' : manifest.inviteCode}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'training'  && <TrainingTab questions={manifest.questions} />}
      {activeTab === 'employees' && <EmployeesTab count={manifest.employeesCount ?? 0} />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'materials' && (
        <MaterialsTab courseId={courseId} files={manifest.files} />
      )}
    </div>
  );
}

// ─── Shared empty state ───────────────────────────────────────────────────────

function TabEmptyState({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-4 py-14 text-center px-8">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-800 mb-1">{title}</h2>
          <p className="text-[13px] text-gray-400 max-w-[280px] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TrainingTab({ questions }: { questions?: Question[] }) {
  if (!questions || questions.length === 0) {
    return (
      <TabEmptyState
        iconBg="bg-lime/10"
        icon={<BookOpen size={22} className="text-lime" strokeWidth={1.5} />}
        title="Вопросы не сгенерированы"
        description="Вопросы тренинга появятся здесь после создания курса через новый мастер."
      />
    );
  }

  const quizCount = questions.filter((q) => q.type === 'quiz').length;
  const openCount = questions.filter((q) => q.type === 'open').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex gap-3">
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm text-sm">
          <span className="font-semibold text-gray-900">{questions.length}</span>
          <span className="text-gray-500 ml-1">вопрос{questions.length === 1 ? '' : 'ов'}</span>
        </div>
        {quizCount > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-blue-700">{quizCount}</span>
            <span className="text-blue-500 ml-1">quiz</span>
          </div>
        )}
        {openCount > 0 && (
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-purple-700">{openCount}</span>
            <span className="text-purple-500 ml-1">open</span>
          </div>
        )}
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                q.type === 'quiz' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
              )}
            >
              {q.type === 'quiz' ? 'Quiz' : 'Open'}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">#{idx + 1}</span>
          </div>
          <p className="text-[14px] font-medium text-gray-900 mb-3 leading-relaxed">{q.prompt}</p>

          {q.type === 'quiz' && q.quizOptions && (
            <div className="flex flex-col gap-1.5">
              {q.quizOptions.map((opt, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                    q.correctIndex === i
                      ? 'bg-lime/10 border border-lime/40 text-gray-900 font-medium'
                      : 'bg-gray-50 border border-gray-100 text-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0',
                      q.correctIndex === i ? 'border-lime bg-lime' : 'border-gray-300'
                    )}
                  />
                  {opt}
                  {q.correctIndex === i && (
                    <CheckCircle2 size={13} className="ml-auto text-[#3d6000]" />
                  )}
                </div>
              ))}
            </div>
          )}

          {q.type === 'open' && q.expectedAnswer && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <p className="text-[11px] font-medium text-gray-400 mb-1">Ожидаемый ответ</p>
              <p className="text-sm text-gray-700 leading-relaxed">{q.expectedAnswer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EmployeesTab({ count }: { count: number }) {
  return (
    <TabEmptyState
      iconBg="bg-blue-50"
      icon={<Users size={22} className="text-blue-400" strokeWidth={1.5} />}
      title={count > 0 ? `${count} сотрудников` : 'Нет сотрудников'}
      description="Сотрудники присоединяются по коду приглашения. Список и прогресс появятся здесь."
    />
  );
}

function AnalyticsTab() {
  return (
    <TabEmptyState
      iconBg="bg-purple-50"
      icon={<BarChart2 size={22} className="text-purple-400" strokeWidth={1.5} />}
      title="Аналитика"
      description="Статистика прохождения, результаты тестов и вовлечённость сотрудников появятся здесь."
    />
  );
}

// ─── Tab: Materials ───────────────────────────────────────────────────────────

function MaterialsTab({
  courseId,
  files,
}: {
  courseId: string;
  files: CourseManifestFile[];
}) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (file: CourseManifestFile) => {
    if (!file.fileId) return;
    setDownloading(file.fileId);
    setDownloadError(null);
    try {
      const res = await apiFetch(`/api/courses/${courseId}/files/${file.fileId}/download`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.detail ?? 'Не удалось получить ссылку');
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.fileName ?? file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: unknown) {
      setDownloadError(e instanceof Error ? e.message : 'Ошибка скачивания');
    } finally {
      setDownloading(null);
    }
  };

  if (files.length === 0) {
    return (
      <TabEmptyState
        iconBg="bg-gray-100"
        icon={<Files size={22} className="text-gray-400" strokeWidth={1.5} />}
        title="Нет материалов"
        description="Загруженные файлы курса появятся здесь."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden">
      {downloadError && (
        <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100 text-[13px] text-red-600">
          <AlertCircle size={13} />
          {downloadError}
        </div>
      )}

      <div className="px-5 py-3.5 border-b border-gray-50">
        <h2 className="text-[13px] font-semibold text-gray-700">
          Файлы курса <span className="text-gray-400 font-normal">({files.length})</span>
        </h2>
      </div>

      <ul className="divide-y divide-gray-50">
        {files.map((file) => (
          <li
            key={file.fileId ?? file.name}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
          >
            {fileIcon(file.name)}

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate">{file.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-gray-400">{formatBytes(file.size)}</span>
                {file.parseStatus === 'parsed' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <CheckCircle2 size={10} />Распознан
                  </span>
                )}
                {file.parseStatus === 'error' && (
                  <span className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={10} />Ошибка парсинга
                  </span>
                )}
                {file.parseStatus === 'skipped' && (
                  <span className="text-[11px] text-gray-400">Пропущен</span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDownload(file)}
              disabled={downloading === file.fileId || !file.fileId}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors shrink-0',
                downloading === file.fileId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-lime/10 hover:border-lime/30 hover:text-[#0B0B0F]'
              )}
            >
              {downloading === file.fileId
                ? <Loader2 size={12} className="animate-spin" />
                : <Download size={12} />
              }
              Скачать
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
