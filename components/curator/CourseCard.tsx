'use client';

import { CourseManifest, CourseOverallStatus } from '@/lib/types';
import { Calendar, Files, Users, Copy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CourseCardProps {
  course: CourseManifest;
}

const STATUS_CONFIG: Record<CourseOverallStatus, { label: string; className: string }> = {
  processing: { label: 'Обработка', className: 'bg-amber-100 text-amber-700' },
  ready:      { label: 'Готов',     className: 'bg-[#C8F65D]/20 text-[#3d6000]' },
  partial:    { label: 'Частично',  className: 'bg-orange-100 text-orange-700' },
  error:      { label: 'Ошибка',    className: 'bg-red-100 text-red-600' },
};

const SIZE_LABELS: Record<string, string> = {
  small: 'Короткий',
  medium: 'Средний',
  large: 'Большой',
};

// Deterministic cover gradient per course
const COVER_GRADIENTS = [
  'from-[#D6EAFF] to-[#EEF6FF]',  // blue
  'from-[#DDD6FE] to-[#EDE9FE]',  // purple
  'from-[#C8F65D]/30 to-[#F7FCE3]', // lime
  'from-[#FDE68A]/40 to-[#FFF9E6]', // yellow
  'from-[#FECDD3]/40 to-[#FFF1F2]', // pink
  'from-[#BBF7D0]/40 to-[#F0FDF4]', // green
  'from-[#FED7AA]/40 to-[#FFF7ED]', // orange
];

const COVER_ICONS = ['📚', '📋', '📝', '🎯', '💼', '🔖', '📊'];

function getCoverIndex(courseId: string): number {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash + courseId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % COVER_GRADIENTS.length;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
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
  const coverIndex = getCoverIndex(course.courseId);
  const coverGradient = COVER_GRADIENTS[coverIndex];
  const coverIcon = COVER_ICONS[coverIndex];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!course.inviteCode) return;
    navigator.clipboard.writeText(course.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const openCourse = () => router.push(`/curator/courses/${course.courseId}`);

  return (
    <div
      className="group flex flex-col bg-white rounded-2xl border border-neutral-200/80 overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-neutral-300/60 transition-all duration-200 cursor-pointer"
      onClick={openCourse}
    >
      {/* Cover */}
      <div className={cn('h-[76px] bg-gradient-to-br flex items-end px-4 pb-3 relative', coverGradient)}>
        <span className="text-2xl leading-none select-none">{coverIcon}</span>
        <span
          className={cn(
            'absolute top-3 right-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-3">
        {/* Title */}
        <h3 className="font-semibold text-[14px] text-gray-900 leading-snug line-clamp-2 flex-1">
          {course.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Files size={11} className="shrink-0" />
            {fileCount}{' '}{fileCount === 1 ? 'файл' : fileCount < 5 ? 'файла' : 'файлов'}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} className="shrink-0" />
            {course.employeesCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className="shrink-0" />
            {formatDate(course.createdAt)}
          </span>
          <span className="ml-auto text-[11px] font-medium text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
            {sizeLabel}
          </span>
        </div>

        {/* Footer: invite code + open btn */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-mono text-gray-500 hover:bg-lime/10 hover:border-lime/40 hover:text-[#0B0B0F] transition-colors"
            title="Скопировать код курса"
          >
            <Copy size={10} />
            {copied ? 'Скопировано!' : (course.inviteCode ?? '——')}
          </button>

          <button
            onClick={openCourse}
            className="ml-auto flex items-center gap-1 rounded-xl bg-lime px-3 py-1 text-[12px] font-semibold text-[#0B0B0F] hover:brightness-95 active:scale-[0.97] transition-all"
          >
            Открыть
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
