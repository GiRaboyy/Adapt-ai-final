import { CourseManifest, CourseOverallStatus } from '@/lib/types';
import { FileText, Calendar, Files, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: CourseManifest;
}

const STATUS_CONFIG: Record<
  CourseOverallStatus,
  { label: string; className: string }
> = {
  processing: {
    label: 'Обработка',
    className: 'bg-yellow-100 text-yellow-700',
  },
  ready: {
    label: 'Готов',
    className: 'bg-emerald-100 text-emerald-700',
  },
  partial: {
    label: 'Частично',
    className: 'bg-orange-100 text-orange-700',
  },
  error: {
    label: 'Ошибка',
    className: 'bg-red-100 text-red-600',
  },
};

const SIZE_LABELS: Record<string, string> = {
  small: 'Короткий',
  medium: 'Средний',
  large: 'Большой',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Б';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const status =
    STATUS_CONFIG[course.overallStatus] ?? STATUS_CONFIG.error;
  const sizeLabel = SIZE_LABELS[course.size] ?? course.size;
  const fileCount = course.files.length;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
      {/* Status badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            status.className
          )}
        >
          {status.label}
        </span>
        <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full">
          {sizeLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-[15px] text-gray-900 leading-snug mb-4 line-clamp-2">
        {course.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Files size={13} className="shrink-0 text-gray-400" />
          <span>{fileCount} {fileCount === 1 ? 'файл' : fileCount < 5 ? 'файла' : 'файлов'}</span>
        </div>

        {course.textBytes > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText size={13} className="shrink-0 text-gray-400" />
            <span>{formatBytes(course.textBytes)} текста</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={13} className="shrink-0 text-gray-400" />
          <span>{formatDate(course.createdAt)}</span>
        </div>
      </div>

      {/* Open button */}
      <button
        className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl border border-gray-100 bg-gray-50 py-2 text-sm font-medium text-gray-700 hover:bg-lime hover:text-[#0F0F14] hover:border-lime transition-colors duration-150"
        onClick={() => {
          /* TODO: navigate to course detail */
        }}
      >
        Открыть
        <ExternalLink size={13} />
      </button>
    </div>
  );
}
