'use client';

import { CourseManifest, CourseOverallStatus } from '@/lib/types';
import { Calendar, Files, Users, Copy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const status = STATUS_CONFIG[course.overallStatus] ?? STATUS_CONFIG.error;
  const sizeLabel = SIZE_LABELS[course.size] ?? course.size;
  const fileCount = course.files.length;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!course.inviteCode) return;
    navigator.clipboard.writeText(course.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const openCourse = () => {
    router.push(`/curator/courses/${course.courseId}`);
  };

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onClick={openCourse}
    >
      {/* Top row: status + size */}
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
          <span>
            {fileCount}{' '}
            {fileCount === 1 ? 'файл' : fileCount < 5 ? 'файла' : 'файлов'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users size={13} className="shrink-0 text-gray-400" />
          <span>
            {course.employeesCount ?? 0} сотрудников
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={13} className="shrink-0 text-gray-400" />
          <span>{formatDate(course.createdAt)}</span>
        </div>
      </div>

      {/* Invite code + open */}
      <div className="mt-5 flex items-center gap-2">
        {/* Invite code chip */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-mono text-gray-600 hover:bg-lime/10 hover:border-lime/30 hover:text-[#0F0F14] transition-colors"
          title="Скопировать код курса"
        >
          <Copy size={11} />
          {copied ? 'Скопировано!' : (course.inviteCode ?? '——')}
        </button>

        {/* Open button */}
        <button
          onClick={openCourse}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-lime px-3 py-1.5 text-xs font-semibold text-[#0F0F14] hover:brightness-95 transition-colors"
        >
          Открыть
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
