'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  FileText,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CourseManifest, CourseSize } from '@/lib/types';
import { apiFetch } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSES_BUCKET = 'courses';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const SIZE_OPTIONS: { value: CourseSize; label: string; description: string }[] = [
  { value: 'small', label: 'Короткий', description: 'До 10 страниц' },
  { value: 'medium', label: 'Средний', description: '10–50 страниц' },
  { value: 'large', label: 'Большой', description: 'Более 50 страниц' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileEntry {
  id: string;
  file: File;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  uploadError?: string;
  storagePath?: string;
}

type PipelineStep =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

interface CreateCourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (manifest: CourseManifest) => void;
  userId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileExt(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/**
 * Convert a Supabase Storage error into a human-readable message.
 * RLS 403 errors are common when bucket policies are missing.
 */
function friendlyUploadError(err: { statusCode?: string | number; message?: string }): string {
  const msg = err.message ?? '';
  if (msg.includes('row-level security') || msg.includes('RLS') || String(err.statusCode) === '403') {
    return 'Нет прав на загрузку. Проверь политики Storage для bucket «courses» в Supabase Dashboard.';
  }
  return `[${err.statusCode ?? 'ERR'}] ${msg}`;
}

/**
 * Build a safe Supabase Storage key for a file.
 * Uses a fresh UUID so the path never contains spaces, Cyrillic, or other
 * characters that Supabase rejects after URL-decoding.
 * The original filename is preserved separately for display purposes.
 */
function safeStorageKey(originalName: string): string {
  const ext = getFileExt(originalName); // already lower-cased, e.g. ".pdf"
  return `${crypto.randomUUID()}${ext}`;
}

/** Infer MIME type from extension when file.type is empty or incorrect. */
function guessContentType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = getFileExt(file.name);
  const map: Record<string, string> = {
    '.pdf':  'application/pdf',
    '.txt':  'text/plain',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
  };
  return map[ext] ?? 'application/octet-stream';
}

function validateFile(file: File): string | null {
  const ext = getFileExt(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Неподдерживаемый тип файла "${ext}". Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (!ALLOWED_MIME_TYPES.has(file.type) && file.type !== '') {
    // Some browsers mis-report MIME; ext check is sufficient
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Файл слишком большой (${formatFileSize(file.size)}). Максимум: ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  return null;
}

function fileIcon(name: string) {
  const ext = getFileExt(name);
  if (ext === '.pdf') return <FileText size={16} className="text-red-400" />;
  if (ext === '.docx' || ext === '.doc')
    return <FileText size={16} className="text-blue-400" />;
  return <File size={16} className="text-gray-400" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateCourseDialog({
  open,
  onClose,
  onSuccess,
  userId,
}: CreateCourseDialogProps) {
  const [title, setTitle] = useState('');
  const [courseSize, setCourseSize] = useState<CourseSize>('medium');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [step, setStep] = useState<PipelineStep>('idle');
  const [stepMessage, setStepMessage] = useState('');
  const [pipelineError, setPipelineError] = useState('');
  const [aborted, setAborted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // ─── Form validation ───────────────────────────────────────────────────────

  const isValid =
    title.trim().length > 0 &&
    courseSize !== undefined &&
    files.length > 0 &&
    // At least one file must not be in error state (allow partial failures)
    files.some((f) => f.uploadStatus !== 'error');

  // ─── File handling ─────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
    const newErrors: Record<string, string> = {};
    const newEntries: FileEntry[] = [];

    for (const file of incoming) {
      const err = validateFile(file);
      if (err) {
        newErrors[file.name] = err;
        continue;
      }
      const duplicate = files.some((f) => f.file.name === file.name && f.file.size === file.size);
      if (duplicate) continue;

      newEntries.push({
        id: crypto.randomUUID(),
        file,
        uploadProgress: 0,
        uploadStatus: 'pending',
      });
    }

    setValidationErrors((prev) => ({ ...prev, ...newErrors }));
    if (newEntries.length > 0) setFiles((prev) => [...prev, ...newEntries]);
  }, [files]);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // ─── Upload pipeline ───────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!isValid || step !== 'idle') return;

    abortRef.current = false;
    setAborted(false);
    setPipelineError('');
    setStep('uploading');

    const supabase = createClient();
    const courseId = crypto.randomUUID();
    const uploadedFiles: Array<{
      name: string;
      originalName: string;
      storagePath: string;
      mimeType: string;
      size: number;
    }> = [];

    // ── Phase 1: Upload files ─────────────────────────────────────────────
    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break;

      const entry = files[i];
      const contentType = guessContentType(entry.file);
      // UUID-only key: no filename in the path → no Cyrillic/spaces issues
      const safeKey = safeStorageKey(entry.file.name);
      const storagePath = `${userId}/${courseId}/files/${safeKey}`;

      setStepMessage(`Загружаем файл ${i + 1} из ${files.length}: ${entry.file.name}`);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 } : f
        )
      );

      try {
        const { error } = await supabase.storage
          .from(COURSES_BUCKET)
          .upload(storagePath, entry.file, {
            upsert: true,
            contentType,
          });

        if (error) {
          console.error('[Storage upload error]', {
            file: entry.file.name,
            storagePath,
            contentType,
            error,
          });
          throw new Error(friendlyUploadError(error));
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, uploadStatus: 'uploaded', uploadProgress: 100, storagePath }
              : f
          )
        );

        uploadedFiles.push({
          name: safeKey,
          originalName: entry.file.name,
          storagePath,
          mimeType: contentType,
          size: entry.file.size,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Upload failed]', entry.file.name, msg);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, uploadStatus: 'error', uploadError: msg }
              : f
          )
        );
        // Continue with other files
      }
    }

    if (abortRef.current) {
      setStep('idle');
      setStepMessage('');
      return;
    }

    if (uploadedFiles.length === 0) {
      const firstError = files.find((f) => f.uploadError)?.uploadError ?? '';
      setPipelineError(
        `Ни один файл не был загружен успешно.${firstError ? ` Ошибка: ${firstError}` : ''} Проверьте консоль браузера (F12 → Console) для деталей.`
      );
      setStep('error');
      return;
    }

    // ── Phase 2: Process (parse + create manifest) on backend ────────────
    setStep('processing');
    setStepMessage(`Парсим файлы на сервере (${uploadedFiles.length})...`);

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
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? data.message ?? 'Сервер вернул ошибку');
      }

      setStep('done');
      setStepMessage('Курс успешно создан!');
      setTimeout(() => {
        resetDialog();
        onSuccess(data.manifest as CourseManifest);
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPipelineError(msg);
      setStep('error');
    }
  };

  // ─── Abort ────────────────────────────────────────────────────────────────

  const handleAbort = () => {
    abortRef.current = true;
    setAborted(true);
    setStep('idle');
    setStepMessage('');
  };

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetDialog = () => {
    setTitle('');
    setCourseSize('medium');
    setFiles([]);
    setValidationErrors({});
    setStep('idle');
    setStepMessage('');
    setPipelineError('');
    setAborted(false);
    abortRef.current = false;
  };

  const handleClose = () => {
    if (step === 'uploading' || step === 'processing') {
      handleAbort();
    }
    resetDialog();
    onClose();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isRunning = step === 'uploading' || step === 'processing';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[540px] rounded-2xl p-0 gap-0 border-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[17px] font-semibold text-gray-900">
            Создать курс
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Загрузите файлы — мы извлечём текст и подготовим базу знаний.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">

          {/* ── Pipeline Progress ── */}
          {isRunning && (
            <div className="flex flex-col gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin text-blue-500 shrink-0" />
                <span className="text-sm text-blue-700 font-medium">{stepMessage}</span>
              </div>
              <Progress
                value={
                  step === 'uploading'
                    ? Math.round(
                        (files.filter((f) => f.uploadStatus === 'uploaded').length /
                          Math.max(files.length, 1)) *
                          100
                      )
                    : 85
                }
                className="h-1.5"
              />
            </div>
          )}

          {step === 'done' && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-700 font-medium">{stepMessage}</span>
            </div>
          )}

          {step === 'error' && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{pipelineError}</span>
            </div>
          )}

          {/* ── Course Name ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Название курса <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Онбординг нового сотрудника"
              disabled={isRunning}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition disabled:opacity-50"
            />
          </div>

          {/* ── Course Size ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Размер курса <span className="text-red-400">*</span>
            </label>
            <Select
              value={courseSize}
              onValueChange={(v) => setCourseSize(v as CourseSize)}
              disabled={isRunning}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-gray-400 text-xs">{opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Dropzone ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Файлы <span className="text-red-400">*</span>
              <span className="ml-2 text-xs text-gray-400 font-normal">
                PDF, TXT, DOC, DOCX · до {formatFileSize(MAX_FILE_SIZE)}
              </span>
            </label>

            <div
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors',
                isDragging
                  ? 'border-lime bg-lime/5'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-50',
                isRunning && 'pointer-events-none opacity-60'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isRunning && fileInputRef.current?.click()}
            >
              <CloudUpload
                size={28}
                className={isDragging ? 'text-lime' : 'text-gray-300'}
              />
              <p className="text-sm text-gray-500 text-center">
                <span className="font-medium text-gray-700">Нажмите для выбора</span> или перетащите файлы
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Validation errors */}
            {Object.entries(validationErrors).map(([name, err]) => (
              <p key={name} className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} />
                <span><b>{name}:</b> {err}</span>
              </p>
            ))}

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {files.map((entry) => (
                  <FileRow
                    key={entry.id}
                    entry={entry}
                    onRemove={() => removeFile(entry.id)}
                    disabled={isRunning}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isRunning ? 'Остановить' : 'Отмена'}
          </button>

          <button
            onClick={handleCreate}
            disabled={!isValid || isRunning || step === 'done'}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all',
              isValid && !isRunning && step !== 'done'
                ? 'bg-lime text-[#0F0F14] hover:brightness-95 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isRunning && <Loader2 size={14} className="animate-spin" />}
            {step === 'done' ? 'Готово!' : 'Создать курс'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── File Row ─────────────────────────────────────────────────────────────────

function FileRow({
  entry,
  onRemove,
  disabled,
}: {
  entry: FileEntry;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm',
        entry.uploadStatus === 'error'
          ? 'border-red-200 bg-red-50'
          : entry.uploadStatus === 'uploaded'
          ? 'border-emerald-100 bg-emerald-50/50'
          : 'border-gray-100 bg-white'
      )}
    >
      <span className="shrink-0">{fileIcon(entry.file.name)}</span>

      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-gray-800 text-xs">{entry.file.name}</p>
        <p className="text-gray-400 text-xs">{formatFileSize(entry.file.size)}</p>
        {entry.uploadStatus === 'uploading' && (
          <Progress value={entry.uploadProgress} className="h-1 mt-1" />
        )}
        {entry.uploadStatus === 'error' && entry.uploadError && (
          <p className="text-red-500 text-xs mt-0.5">{entry.uploadError}</p>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {entry.uploadStatus === 'uploading' && (
          <Loader2 size={13} className="animate-spin text-blue-400" />
        )}
        {entry.uploadStatus === 'uploaded' && (
          <CheckCircle2 size={13} className="text-emerald-500" />
        )}
        {entry.uploadStatus === 'error' && (
          <AlertCircle size={13} className="text-red-400" />
        )}
      </div>

      {/* Remove */}
      {!disabled && (
        <button
          onClick={onRemove}
          className="shrink-0 rounded-md p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
