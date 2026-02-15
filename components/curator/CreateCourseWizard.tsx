'use client';

/**
 * CreateCourseWizard — fullscreen 3-phase course creation wizard.
 * Phase 1 (form):    title + size radio cards + file upload → POST /api/courses/draft
 * Phase 2 (loading): animated progress steps → POST /api/training/generate
 * Phase 3 (editing): 3-column question editor → POST /api/courses/finalize
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, FileText, File, AlertCircle, CloudUpload, Plus, Trash2,
  ChevronUp, ChevronDown, Check, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, safeJson } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import {
  CourseManifest, CourseSize, Question, QuestionType,
  DraftPayload,
} from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

// Files are uploaded directly to Supabase Storage (bypasses Vercel ~4.5 MB body limit).
const MAX_FILE_SIZE   = 30 * 1024 * 1024;   // 30 MB per file
const MAX_TOTAL_SIZE  = 300 * 1024 * 1024;  // 300 MB total across all files
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'];
const COURSES_BUCKET = 'courses';

const SIZE_OPTIONS: { value: CourseSize; label: string; duration: string }[] = [
  { value: 'small',  label: 'Короткий', duration: '10–15 минут' },
  { value: 'medium', label: 'Средний',  duration: '20–30 минут' },
  { value: 'large',  label: 'Длинный',  duration: '45–60 минут' },
];

const LOADING_STEPS = [
  'Загружаем файлы',
  'Парсим материалы',
  'Генерируем вопросы',
  'Готовим редактор',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileEntry {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  storagePath?: string;
}

type Phase = 'form' | 'loading' | 'editing' | 'saving';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (manifest: CourseManifest) => void;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileExt(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

function friendlyUploadError(err: { statusCode?: string | number; message?: string }): string {
  const msg = err.message ?? '';
  if (msg.includes('row-level security') || msg.includes('RLS') || String(err.statusCode) === '403') {
    return 'Нет прав на загрузку. Проверь политики Storage для bucket «courses» в Supabase Dashboard.';
  }
  return `[${err.statusCode ?? 'ERR'}] ${msg}`;
}

function safeStorageKey(originalName: string): string {
  const ext = getFileExt(originalName);
  return `${crypto.randomUUID()}${ext}`;
}

function guessContentType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = getFileExt(file.name);
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
  };
  return map[ext] ?? 'application/octet-stream';
}

function validateFile(file: File): string | null {
  const ext = getFileExt(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Неподдерживаемый тип файла "${ext}". Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Файл слишком большой (${formatFileSize(file.size)}). Макс: ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  return null;
}

function fileIcon(name: string) {
  const ext = getFileExt(name);
  if (ext === '.pdf') return <FileText size={16} className="text-red-500" />;
  if (ext === '.docx' || ext === '.doc') return <FileText size={16} className="text-blue-500" />;
  return <File size={16} className="text-gray-400" />;
}

function newQuestion(type: QuestionType): Question {
  return type === 'quiz'
    ? { id: crypto.randomUUID(), type: 'quiz', prompt: '', quizOptions: ['', '', '', ''], correctIndex: 0 }
    : { id: crypto.randomUUID(), type: 'open', prompt: '', expectedAnswer: '' };
}

// ─── Shared Header ────────────────────────────────────────────────────────────

function WizardHeader({
  breadcrumb,
  right,
}: {
  breadcrumb: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="bg-black text-white h-16 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#85EB59] rounded flex items-center justify-center">
            <span className="font-black text-black text-lg italic">⚡</span>
          </div>
          <span className="font-bold text-xl tracking-tighter italic">ADAPT</span>
        </div>
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="hover:text-white transition-colors cursor-default">Курсы</span>
          <span className="text-gray-600 text-xs">›</span>
          <span className="text-white font-medium">{breadcrumb}</span>
        </nav>
      </div>
      <div className="flex items-center gap-4">{right}</div>
    </header>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ phase }: { phase: Phase }) {
  const step1Done = phase === 'editing' || phase === 'saving';
  const step1Loading = phase === 'loading';
  const step1Active = phase === 'form';
  const step2Active = phase === 'editing' || phase === 'saving';

  return (
    <div className="border-b border-gray-100 bg-white shrink-0 z-40">
      <div className="max-w-4xl mx-auto py-5 px-4">
        <div className="flex items-center justify-center gap-16 relative">
          {/* Connector line */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-[2px] bg-gray-100 -z-10 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-700',
                step1Done
                  ? 'bg-[#85EB59] w-full'
                  : step1Loading
                  ? 'bg-[#85EB59] w-1/2 animate-pulse'
                  : 'bg-gray-200 w-0'
              )}
            />
          </div>

          {/* Step 1 */}
          <div className="flex items-center gap-3 bg-white px-2">
            <div
              className={cn(
                'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all',
                step1Done
                  ? 'border-[#85EB59] bg-[#85EB59] text-black'
                  : step1Active
                  ? 'border-[#85EB59] bg-[#85EB59] text-black shadow-[0_0_10px_rgba(133,235,89,0.3)]'
                  : step1Loading
                  ? 'border-[#85EB59] bg-white text-[#85EB59]'
                  : 'border-gray-200 text-gray-400 bg-white'
              )}
            >
              {step1Done ? (
                <Check size={13} strokeWidth={3} />
              ) : step1Loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                '1'
              )}
            </div>
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                step1Done
                  ? 'text-gray-400'
                  : step1Active || step1Loading
                  ? 'text-[#85EB59]'
                  : 'text-gray-400'
              )}
            >
              {step1Loading ? 'В процессе...' : step1Done ? 'Создание курса' : 'Создание курса'}
            </span>
          </div>

          {/* Step 2 */}
          <div className={cn('flex items-center gap-3 bg-white px-2', !step2Active && 'opacity-40')}>
            <div
              className={cn(
                'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                step2Active
                  ? 'border-[#85EB59] bg-[#85EB59] text-black shadow-[0_0_0_3px_rgba(133,235,89,0.2)]'
                  : 'border-gray-200 text-gray-400 bg-white'
              )}
            >
              2
            </div>
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider',
                step2Active ? 'text-black' : 'text-gray-400'
              )}
            >
              Редактирование
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 1: Form ────────────────────────────────────────────────────────────

function FormPhase({
  title,
  setTitle,
  courseSize,
  setCourseSize,
  files,
  isDragging,
  setIsDragging,
  fileInputRef,
  addFiles,
  removeFile,
  validationErrors,
  error,
  onSubmit,
  isSubmitting,
  onClose,
}: {
  title: string;
  setTitle: (v: string) => void;
  courseSize: CourseSize;
  setCourseSize: (v: CourseSize) => void;
  files: FileEntry[];
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  validationErrors: Record<string, string>;
  error: string;
  onSubmit: () => void;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  const isValid =
    title.trim().length > 0 &&
    files.length > 0 &&
    files.some((f) => f.status !== 'error');

  return (
    <>
      <WizardHeader
        breadcrumb="Новый курс"
        right={
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Назад к курсам
          </button>
        }
      />
      <ProgressBar phase="form" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[840px] mx-auto py-12 px-4 space-y-12">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Создание нового курса</h1>
            <p className="text-gray-500">
              Заполните основные параметры, загрузите материалы, и ИИ создаст структуру обучения.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 flex-1">{error}</p>
            </div>
          )}

          {/* Title */}
          <section className="space-y-4">
            <div className="flex justify-between items-baseline">
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                Название курса
              </label>
              <span className="text-xs text-gray-400">Обязательно</span>
            </div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Основы кибербезопасности для сотрудников"
              disabled={isSubmitting}
              className="w-full border border-gray-200 rounded-lg focus:border-[#85EB59] focus:ring-1 focus:ring-[#85EB59] transition-colors py-3 px-4 text-lg placeholder:text-gray-300 outline-none disabled:opacity-50"
            />
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="text-base">👁</span>
              Это название увидят сотрудники в личном кабинете
            </p>
          </section>

          <hr className="border-gray-100" />

          {/* Course size */}
          <section className="space-y-4">
            <div className="flex justify-between items-baseline">
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                Размер курса
              </label>
              <span className="text-xs text-gray-400">Обязательно</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SIZE_OPTIONS.map((opt) => {
                const selected = courseSize === opt.value;
                return (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="courseSize"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setCourseSize(opt.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'p-5 border-2 rounded-xl transition-all h-full flex flex-col justify-between',
                        selected
                          ? 'border-[#85EB59] bg-[#85EB59]/5 ring-1 ring-[#85EB59]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <div>
                        <span className="block text-base font-bold text-gray-900 mb-1">
                          {opt.label}
                        </span>
                        <span className="text-sm text-gray-500">{opt.duration}</span>
                      </div>
                      <div
                        className={cn(
                          'mt-4 flex items-center gap-1 text-xs font-medium transition-opacity text-[#85EB59]',
                          selected ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        <Check size={14} />
                        Выбрано
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-gray-500">
              ИИ подберёт оптимальное количество модулей под выбранный объём.
            </p>
          </section>

          <hr className="border-gray-100" />

          {/* File upload */}
          <section className="space-y-6">
            <div className="flex justify-between items-baseline">
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                Файлы для генерации
              </label>
              <span className="text-xs text-gray-400">Минимум 1 файл</span>
            </div>

            {/* Uploaded files */}
            {files.length > 0 && (
              <div className="space-y-3">
                {files.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center">
                        {fileIcon(entry.file.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(entry.file.size)}</p>
                        {entry.error && (
                          <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>
                        )}
                      </div>
                    </div>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => removeFile(entry.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Drag & drop zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group transition-all bg-gray-50/50',
                isDragging
                  ? 'border-[#85EB59] bg-[#85EB59]/5'
                  : 'border-gray-300 hover:border-[#85EB59] hover:bg-[#85EB59]/5',
                isSubmitting && 'pointer-events-none opacity-60'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                addFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CloudUpload
                  size={28}
                  className={cn(
                    'transition-colors',
                    isDragging ? 'text-[#85EB59]' : 'text-gray-400 group-hover:text-[#85EB59]'
                  )}
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Перетащите файлы сюда</h3>
              <p className="text-sm text-gray-500 mb-1">или нажмите для выбора с компьютера</p>
              <p className="text-xs text-gray-400 mb-5">Макс. 30 МБ на файл, 300 МБ суммарно</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['PDF', 'DOCX', 'TXT'].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 bg-gray-100 rounded text-xs font-bold text-gray-400 uppercase tracking-wider"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    addFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Validation errors */}
            {Object.entries(validationErrors).map(([name, err]) => (
              <p key={name} className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertCircle size={12} />
                <span>
                  <b>{name}:</b> {err}
                </span>
              </p>
            ))}
          </section>

          {/* CTA */}
          <button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-sm text-base',
              isValid && !isSubmitting
                ? 'bg-[#85EB59] hover:bg-[#76d44f] text-black'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Загружаем файлы...
              </>
            ) : (
              'Создать курс с помощью ИИ →'
            )}
          </button>

          <div className="h-8" />
        </div>
      </main>
    </>
  );
}

// ─── Phase 2: Loading ─────────────────────────────────────────────────────────

function LoadingPhase({
  loadingStep,
  onCancel,
}: {
  loadingStep: number; // 0-3, which step is active
  onCancel: () => void;
}) {
  return (
    <>
      <WizardHeader breadcrumb="Новый курс" />
      <ProgressBar phase="loading" />

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#85EB59]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#FFBA49]/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-md w-full flex flex-col items-center text-center">
          {/* Spinner */}
          <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#85EB59] animate-ping opacity-20" />
            <svg className="w-full h-full transform -rotate-90 absolute inset-0">
              <circle cx="64" cy="64" r="60" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="#85EB59"
                strokeWidth="4"
                strokeDasharray="377"
                strokeDashoffset="100"
                style={{ animation: 'dash 3s ease-in-out infinite' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">✨</span>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-3 text-gray-900">
            Генерируем курс...
          </h1>
          <p className="text-gray-500 text-lg mb-12">Анализируем файлы и собираем структуру</p>

          {/* Progress steps */}
          <div className="w-full max-w-sm space-y-5 bg-white rounded-2xl p-6 border border-gray-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {LOADING_STEPS.map((label, idx) => {
              const isDone = idx < loadingStep;
              const isActive = idx === loadingStep;
              const isPending = idx > loadingStep;

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-4 transition-all duration-500',
                    isPending && 'opacity-40'
                  )}
                >
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-[#85EB59] flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} className="text-black" />
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-[#85EB59] border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-sm transition-all',
                      isDone || isActive ? 'font-medium text-gray-900' : 'font-medium text-gray-500'
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cancel */}
          <div className="mt-12">
            <button
              onClick={onCancel}
              className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Отменить генерацию
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes dash {
          0% { stroke-dashoffset: 377; }
          50% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 377; }
        }
      `}</style>
    </>
  );
}

// ─── Phase 3: Editing ─────────────────────────────────────────────────────────

function EditingPhase({
  title,
  questions,
  selectedIdx,
  setSelectedIdx,
  updateQuestion,
  deleteQuestion,
  moveUp,
  moveDown,
  addQuestion,
  onSave,
  onRegenerate,
  isSaving,
  error,
}: {
  title: string;
  questions: Question[];
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
  updateQuestion: (idx: number, q: Question) => void;
  deleteQuestion: (idx: number) => void;
  moveUp: (idx: number) => void;
  moveDown: (idx: number) => void;
  addQuestion: (type: QuestionType) => void;
  onSave: () => void;
  onRegenerate: () => void;
  isSaving: boolean;
  error: string;
}) {
  const selected = questions[selectedIdx] ?? null;

  return (
    <>
      <WizardHeader breadcrumb={title || 'Редактирование'} />
      <ProgressBar phase="editing" />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 px-6 py-2 bg-amber-50 border-b border-amber-200">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {/* Empty questions warning */}
      {questions.length === 0 && !error && (
        <div className="flex items-start gap-3 px-6 py-3 bg-gold/10 border-b border-gold/30">
          <AlertCircle size={18} className="text-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-ink">Вопросы не были сгенерированы</p>
            <p className="text-xs text-gray-600 mt-1">
              Добавьте вопросы вручную или нажмите «Перегенерировать».
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gold text-ink hover:bg-gold/90 transition-colors shrink-0"
          >
            Перегенерировать
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — structure/navigation */}
        <aside className="w-[300px] border-r border-gray-100 flex flex-col shrink-0 bg-white">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">
              Структура курса
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {questions.map((q, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all relative',
                    isSelected
                      ? 'bg-[#85EB59]/10 border border-[#85EB59]/20 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  )}
                >
                  {isSelected && (
                    <div className="absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#85EB59] rounded-r" />
                  )}
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0',
                      q.type === 'quiz'
                        ? 'bg-[#FFBA49] text-black'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {q.type === 'quiz' ? 'Квиз' : 'Откр.'}
                  </span>
                  <span
                    className={cn(
                      'text-sm truncate flex-1',
                      isSelected ? 'font-medium text-black' : 'text-gray-600'
                    )}
                  >
                    {idx + 1}. {q.prompt || 'Без названия'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => {
                addQuestion('quiz');
                setSelectedIdx(questions.length);
              }}
              className="w-full py-2 text-xs font-bold uppercase tracking-wide border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#85EB59] hover:text-[#85EB59] hover:bg-[#85EB59]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={13} />
              Добавить Quiz
            </button>
            <button
              onClick={() => {
                addQuestion('open');
                setSelectedIdx(questions.length);
              }}
              className="w-full py-2 text-xs font-bold uppercase tracking-wide border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FFBA49] hover:text-[#FFBA49] hover:bg-[#FFBA49]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={13} />
              Открытый вопрос
            </button>
          </div>
        </aside>

        {/* Center — question editor */}
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          <div className="max-w-3xl mx-auto py-10 px-8 pb-32">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
                  <Plus size={22} className="text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold">Вопросы отсутствуют</p>
                <p className="text-gray-400 text-sm">Используйте кнопки слева для добавления вопросов</p>
              </div>
            ) : selected ? (
              <>
                {/* Editable title */}
                <div className="mb-8 group">
                  <input
                    type="text"
                    value={selected.prompt}
                    onChange={(e) => updateQuestion(selectedIdx, { ...selected, prompt: e.target.value })}
                    placeholder="Текст вопроса..."
                    className="w-full text-3xl font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder-gray-300 outline-none"
                  />
                  <div className="h-0.5 w-full bg-transparent group-hover:bg-gray-200 mt-2 transition-colors" />
                </div>

                {/* Question editor card */}
                <div className="border-2 border-[#85EB59] rounded-2xl bg-white shadow-lg overflow-hidden">
                  <div className="bg-[#85EB59]/10 px-6 py-4 border-b border-[#85EB59]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#FFBA49] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                        {selected.type === 'quiz' ? 'Квиз' : 'Открытый'}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Редактирование вопроса
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(selectedIdx)}
                        disabled={selectedIdx === 0}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Переместить вверх"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        onClick={() => moveDown(selectedIdx)}
                        disabled={selectedIdx === questions.length - 1}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Переместить вниз"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        onClick={() => {
                          deleteQuestion(selectedIdx);
                          setSelectedIdx(Math.max(0, selectedIdx - 1));
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить вопрос"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Prompt textarea */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-1">
                        Текст вопроса
                      </label>
                      <textarea
                        value={selected.prompt}
                        onChange={(e) => updateQuestion(selectedIdx, { ...selected, prompt: e.target.value })}
                        placeholder="Введите текст вопроса..."
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#85EB59] focus:border-transparent text-base font-medium resize-none transition-all outline-none"
                      />
                    </div>

                    {/* Quiz options */}
                    {selected.type === 'quiz' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-1">
                          Варианты ответа
                        </label>
                        {(selected.quizOptions ?? ['', '', '', '']).map((opt, i) => {
                          const isCorrect = selected.correctIndex === i;
                          return (
                            <div
                              key={i}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                                isCorrect
                                  ? 'border-[#85EB59] bg-[#85EB59]/5'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              )}
                            >
                              <input
                                type="radio"
                                name={`correct-${selected.id}`}
                                checked={isCorrect}
                                onChange={() =>
                                  updateQuestion(selectedIdx, {
                                    ...selected,
                                    correctIndex: i as 0 | 1 | 2 | 3,
                                  })
                                }
                                className="w-5 h-5 cursor-pointer accent-[#85EB59]"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const opts = [
                                    ...(selected.quizOptions ?? ['', '', '', '']),
                                  ] as [string, string, string, string];
                                  opts[i] = e.target.value;
                                  updateQuestion(selectedIdx, { ...selected, quizOptions: opts });
                                }}
                                placeholder={`Вариант ${i + 1}`}
                                className="flex-1 bg-transparent border-none focus:ring-0 font-medium text-gray-900 placeholder-gray-400 outline-none"
                              />
                              {isCorrect && (
                                <div className="text-[#85EB59] flex items-center gap-1 text-xs font-bold uppercase px-2 shrink-0">
                                  <Check size={14} />
                                  Верно
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Open answer */}
                    {selected.type === 'open' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 pl-1">
                          Ожидаемый ответ / критерии
                        </label>
                        <textarea
                          value={selected.expectedAnswer ?? ''}
                          onChange={(e) =>
                            updateQuestion(selectedIdx, {
                              ...selected,
                              expectedAnswer: e.target.value,
                            })
                          }
                          placeholder="Образец ответа или критерии оценки..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#85EB59] focus:border-transparent text-base resize-none transition-all outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center gap-2">
                <p className="text-gray-400 text-sm">Выберите вопрос слева</p>
              </div>
            )}
          </div>
        </main>

      </div>

      {/* Sticky save rail — bottom right */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-[#85EB59] shadow-[0_0_6px_#85EB59]" />
          <span className="text-gray-200">Черновик</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isSaving}
            className="bg-[#ffba49] hover:bg-[#f0ad3a] text-black font-semibold py-3 px-5 rounded-xl transition-all text-sm shadow-lg shadow-[#ffba49]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Перегенерировать
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || questions.length === 0}
            className={cn(
              'bg-[#85EB59] hover:bg-[#76d44f] text-black font-semibold py-3 px-8 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-[#85EB59]/20',
              (isSaving || questions.length === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

export function CreateCourseWizard({ open, onClose, onSuccess, userId }: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [courseSize, setCourseSize] = useState<CourseSize>('medium');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading step (0-3)
  const [loadingStep, setLoadingStep] = useState(0);

  // Editing state
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setPhase('form');
      setError('');
      setTitle('');
      setCourseSize('medium');
      setFiles([]);
      setValidationErrors({});
      setLoadingStep(0);
      setDraft(null);
      setQuestions([]);
      setSelectedIdx(0);
    }
  }, [open]);

  // ── File handling ──────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (incoming: File[]) => {
      const newErrors: Record<string, string> = {};
      const newEntries: FileEntry[] = [];
      for (const file of incoming) {
        const err = validateFile(file);
        if (err) { newErrors[file.name] = err; continue; }
        const dup = files.some((f) => f.file.name === file.name && f.file.size === file.size);
        if (dup) continue;
        newEntries.push({ id: crypto.randomUUID(), file, status: 'pending' });
      }
      setValidationErrors((prev) => ({ ...prev, ...newErrors }));
      if (newEntries.length > 0) setFiles((prev) => [...prev, ...newEntries]);
    },
    [files]
  );

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ── Submit flow ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setPhase('loading');
    setLoadingStep(0);
    setError('');

    // Guard: total payload size
    const totalSize = files.reduce((sum, e) => sum + e.file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError(
        `Суммарный размер файлов (${formatFileSize(totalSize)}) превышает лимит ${formatFileSize(MAX_TOTAL_SIZE)}. ` +
        'Пожалуйста, уменьшите количество или размер файлов.'
      );
      setPhase('form');
      return;
    }

    const supabase = createClient();
    const courseId = crypto.randomUUID();

    // ── Step 0: Upload files directly to Supabase Storage ──────────────────
    const uploadedFiles: Array<{
      name: string; originalName: string; storagePath: string; mimeType: string; size: number;
    }> = [];

    for (const entry of files) {
      const contentType = guessContentType(entry.file);
      const safeKey = safeStorageKey(entry.file.name);
      const storagePath = `${userId}/${courseId}/files/${safeKey}`;

      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, status: 'uploading' as const } : f
      ));

      try {
        const { error: uploadErr } = await supabase.storage
          .from(COURSES_BUCKET)
          .upload(storagePath, entry.file, { upsert: true, contentType });
        if (uploadErr) throw new Error(friendlyUploadError(uploadErr));

        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'done' as const, storagePath } : f
        ));
        uploadedFiles.push({
          name: safeKey, originalName: entry.file.name, storagePath, mimeType: contentType, size: entry.file.size,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'error' as const, error: msg } : f
        ));
      }
    }

    if (uploadedFiles.length === 0) {
      setError('Ни один файл не загружен успешно. Проверьте формат файлов и попробуйте снова.');
      setPhase('form');
      return;
    }

    // ── Step 1: Call /api/courses/process to parse files + get extractedText ─
    setLoadingStep(1);

    let extractedText = '';
    try {
      const res = await apiFetch('/api/courses/process', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          userId,
          title: title.trim(),
          size: courseSize,
          files: uploadedFiles,
        }),
      });
      const data = await safeJson<{
        ok: boolean; manifest: CourseManifest;
        extractedText?: string; extractedStats?: { chars: number; filesCount: number; truncated: boolean };
      }>(res);
      if (!data.ok) throw new Error('Ошибка парсинга файлов');
      extractedText = data.extractedText ?? '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('form');
      return;
    }

    if (!extractedText || extractedText.trim().length < 100) {
      setError('Не удалось извлечь достаточно текста из загруженных файлов. Возможно, PDF — скан. Загрузите текстовый PDF, DOCX или TXT.');
      setPhase('form');
      return;
    }

    // Build draft payload for finalize step
    const draftPayload: DraftPayload = {
      draftCourseId: courseId,
      uploadedFiles: uploadedFiles.map(f => ({
        path: f.name, storagePath: f.storagePath, originalName: f.originalName, mime: f.mimeType, size: f.size,
      })),
      extractedText,
      extractedStats: { chars: extractedText.length, filesCount: uploadedFiles.length, truncated: false },
    };
    setDraft(draftPayload);

    // ── Step 2: Generate questions via /api/training/generate ───────────────
    setLoadingStep(2);

    try {
      const res = await apiFetch('/api/training/generate', {
        method: 'POST',
        body: JSON.stringify({
          draftCourseId: courseId,
          title: title.trim(),
          size: courseSize,
          extractedText,
        }),
      });
      const data = await safeJson<{ ok: boolean; questions: Question[] }>(res);
      if (!data.ok) throw new Error('Ошибка генерации вопросов');
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Не удалось сгенерировать вопросы. Попробуйте ещё раз.');
      }

      // Step 3: Ready
      setLoadingStep(3);
      await new Promise((r) => setTimeout(r, 500));

      setQuestions(data.questions);
      setSelectedIdx(0);
      setPhase('editing');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('form');
    }
  };

  // ── Question editing helpers ───────────────────────────────────────────────

  const updateQuestion = (idx: number, q: Question) =>
    setQuestions((prev) => prev.map((old, i) => (i === idx ? q : old)));

  const deleteQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setSelectedIdx(idx - 1);
  };

  const moveDown = (idx: number) => {
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setSelectedIdx(idx + 1);
  };

  const addQuestion = (type: QuestionType) =>
    setQuestions((prev) => [...prev, newQuestion(type)]);

  // ── Finalize ───────────────────────────────────────────────────────────────

  const handleRegenerate = async () => {
    if (!draft) return;
    setPhase('loading');
    setLoadingStep(2);
    setError('');
    try {
      const res = await apiFetch('/api/training/generate', {
        method: 'POST',
        body: JSON.stringify({
          draftCourseId: draft.draftCourseId,
          title: title.trim(),
          size: courseSize,
          extractedText: draft.extractedText,
        }),
      });
      const data = await safeJson<{ ok: boolean; questions: Question[] }>(res);
      if (!data.ok) throw new Error('Ошибка генерации вопросов');
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Не удалось сгенерировать вопросы. Попробуйте ещё раз.');
      }
      setQuestions(data.questions);
      setSelectedIdx(0);
      setPhase('editing');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('editing');
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    if (questions.length === 0) {
      setError('Нельзя сохранить курс без вопросов. Добавьте вопросы вручную или нажмите «Перегенерировать».');
      return;
    }
    setPhase('saving');
    setError('');
    try {
      const res = await apiFetch('/api/courses/finalize', {
        method: 'POST',
        body: JSON.stringify({
          draftCourseId: draft.draftCourseId,
          title: title.trim(),
          size: courseSize,
          uploadedFiles: draft.uploadedFiles,
          questions,
        }),
      });
      const data = await safeJson<{ ok: boolean; courseId: string; courseCode: string }>(res);
      if (!data.ok) {
        throw new Error('Ошибка сохранения курса');
      }
      const manifestRes = await apiFetch(`/api/courses/${data.courseId}`);
      const manifestData = await safeJson<{ manifest: CourseManifest }>(manifestRes);
      const manifest = manifestData.manifest;
      onSuccess(manifest);
      onClose();
      router.push(`/curator/courses/${data.courseId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('editing');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {phase === 'form' && (
        <FormPhase
          title={title}
          setTitle={setTitle}
          courseSize={courseSize}
          setCourseSize={setCourseSize}
          files={files}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          addFiles={addFiles}
          removeFile={removeFile}
          validationErrors={validationErrors}
          error={error}
          onSubmit={handleSubmit}
          isSubmitting={false}
          onClose={onClose}
        />
      )}

      {phase === 'loading' && (
        <LoadingPhase
          loadingStep={loadingStep}
          onCancel={() => {
            setPhase('form');
            setLoadingStep(0);
          }}
        />
      )}

      {(phase === 'editing' || phase === 'saving') && (
        <EditingPhase
          title={title}
          questions={questions}
          selectedIdx={selectedIdx}
          setSelectedIdx={setSelectedIdx}
          updateQuestion={updateQuestion}
          deleteQuestion={deleteQuestion}
          moveUp={moveUp}
          moveDown={moveDown}
          addQuestion={addQuestion}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          isSaving={phase === 'saving'}
          error={error}
        />
      )}
    </div>
  );
}
