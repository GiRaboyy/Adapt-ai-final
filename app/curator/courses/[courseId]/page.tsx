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
} from 'lucide-react';
import { CourseManifest, CourseManifestFile } from '@/lib/types';
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
  ready: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-orange-100 text-orange-700',
  error: 'bg-red-100 text-red-600',
  processing: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  ready: 'Готов',
  partial: 'Частично',
  error: 'Ошибка',
  processing: 'Обработка',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function fileIcon(name: string) {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return <FileText size={16} className="text-red-400 shrink-0" />;
  if (ext === 'docx' || ext === 'doc')
    return <FileText size={16} className="text-blue-400 shrink-0" />;
  return <File size={16} className="text-gray-400 shrink-0" />;
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'training' | 'employees' | 'analytics' | 'materials';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'training', label: 'Тренинг', icon: <BookOpen size={15} /> },
  { id: 'employees', label: 'Сотрудники', icon: <Users size={15} /> },
  { id: 'analytics', label: 'Аналитика', icon: <BarChart2 size={15} /> },
  { id: 'materials', label: 'Материалы', icon: <Files size={15} /> },
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
        if (data.ok) {
          setManifest(data.manifest as CourseManifest);
        } else {
          setError('Курс не найден');
        }
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
      <div className="px-8 py-8 max-w-5xl">
        <Skeleton className="h-5 w-32 rounded-lg mb-6" />
        <Skeleton className="h-8 w-64 rounded-xl mb-4" />
        <div className="flex gap-3 mb-8">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <Skeleton key={t.id} className="h-9 w-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="px-8 py-16 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">{error || 'Курс не найден'}</p>
        <button
          onClick={() => router.push('/curator/courses')}
          className="text-sm text-lime font-medium hover:underline"
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
    <div className="px-8 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/curator/courses')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft size={15} />
        Мои курсы
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            {manifest.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColor
              )}
            >
              {statusLabel}
            </span>
            <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
              {sizeLabel}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Files size={12} />
              {manifest.files.length} файлов
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={12} />
              {manifest.employeesCount ?? 0} сотрудников
            </span>
          </div>
        </div>

        {/* Invite code */}
        <button
          onClick={copyCode}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-mono text-gray-700 hover:bg-lime/10 hover:border-lime/30 transition-colors shadow-sm shrink-0"
          title="Скопировать код для сотрудников"
        >
          <Copy size={13} />
          {codeCopied ? 'Скопировано!' : manifest.inviteCode}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
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
      {activeTab === 'training' && <TrainingTab />}
      {activeTab === 'employees' && <EmployeesTab count={manifest.employeesCount ?? 0} />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'materials' && (
        <MaterialsTab courseId={courseId} files={manifest.files} />
      )}
    </div>
  );
}

// ─── Tab: Training ────────────────────────────────────────────────────────────

function TrainingTab() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-lime/10 flex items-center justify-center">
          <BookOpen size={24} className="text-lime" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Модули тренинга</h2>
          <p className="text-sm text-gray-400 max-w-xs">
            Здесь будут модули и задания для прохождения курса сотрудниками.
            Функциональность в разработке.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Employees ───────────────────────────────────────────────────────────

function EmployeesTab({ count }: { count: number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Users size={24} className="text-blue-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            {count > 0 ? `${count} сотрудников` : 'Нет сотрудников'}
          </h2>
          <p className="text-sm text-gray-400 max-w-xs">
            Сотрудники присоединяются по коду приглашения. Список и прогресс
            появятся здесь.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────

function AnalyticsTab() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
          <BarChart2 size={24} className="text-purple-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Аналитика</h2>
          <p className="text-sm text-gray-400 max-w-xs">
            Статистика прохождения, результаты тестов и вовлечённость сотрудников
            появятся здесь.
          </p>
        </div>
      </div>
    </div>
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
      const res = await apiFetch(
        `/api/courses/${courseId}/files/${file.fileId}/download`
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? 'Не удалось получить ссылку');
      }
      // Trigger browser download
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
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Files size={32} className="text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-400">Нет загруженных материалов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {downloadError && (
        <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">
          <AlertCircle size={14} />
          {downloadError}
        </div>
      )}

      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Файлы курса ({files.length})
        </h2>
      </div>

      <ul className="divide-y divide-gray-50">
        {files.map((file) => (
          <li
            key={file.fileId ?? file.name}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
          >
            {fileIcon(file.name)}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
                {file.parseStatus === 'parsed' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 size={10} />
                    Распознан
                  </span>
                )}
                {file.parseStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={10} />
                    Ошибка парсинга
                  </span>
                )}
                {file.parseStatus === 'skipped' && (
                  <span className="text-xs text-gray-400">Пропущен</span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDownload(file)}
              disabled={downloading === file.fileId || !file.fileId}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0',
                downloading === file.fileId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-lime/10 hover:border-lime/30 hover:text-[#0F0F14]'
              )}
            >
              {downloading === file.fileId ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Download size={12} />
              )}
              Скачать
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
