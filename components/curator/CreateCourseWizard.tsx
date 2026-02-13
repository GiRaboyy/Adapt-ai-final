'use client';

/**
 * CreateCourseWizard — fullscreen 2-step course creation wizard.
 * Step 1: Upload files + parse (POST /api/courses/draft)
 * Step 2: Yandex AI generates questions → user edits → finalize (POST /api/courses/finalize)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, X, FileText, File, CheckCircle2, AlertCircle,
  Loader2, CloudUpload, ChevronUp, ChevronDown, Plus, Trash2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import {
  CourseManifest, CourseSize, Question, QuestionType,
  DraftPayload, DraftUploadedFile,
} from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'];

const SIZE_OPTIONS: { value: CourseSize; label: string; description: string }[] = [
  { value: 'small',  label: 'Короткий', description: '8-12 вопросов' },
  { value: 'medium', label: 'Средний',  description: '12-18 вопросов' },
  { value: 'large',  label: 'Большой',  description: '18-30 вопросов' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileEntry {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

type WizardStep = 1 | 2;
type Phase =
  | 'idle'       // Step 1 form
  | 'uploading'  // Step 1 in flight
  | 'generating' // Step 2 calling Yandex
  | 'editing'    // Step 2 question editor
  | 'saving'     // Step 2 finalizing
  | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (manifest: CourseManifest) => void;
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
  if (ext === '.pdf') return <FileText size={15} className="text-red-400" />;
  if (ext === '.docx' || ext === '.doc') return <FileText size={15} className="text-blue-400" />;
  return <File size={15} className="text-gray-400" />;
}

function newQuestion(type: QuestionType): Question {
  return type === 'quiz'
    ? {
        id: crypto.randomUUID(),
        type: 'quiz',
        prompt: '',
        quizOptions: ['', '', '', ''],
        correctIndex: 0,
      }
    : {
        id: crypto.randomUUID(),
        type: 'open',
        prompt: '',
        expectedAnswer: '',
      };
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: WizardStep }) {
  const steps = ['Файлы и параметры', 'Тренинг и вопросы'];
  return (
    <div className="flex items-center gap-0 w-full max-w-sm">
      {steps.map((label, idx) => {
        const num = idx + 1 as WizardStep;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                  isDone ? 'bg-lime text-[#0F0F14]' :
                  isActive ? 'bg-[#0F0F14] text-white' :
                  'bg-gray-200 text-gray-400'
                )}
              >
                {isDone ? <CheckCircle2 size={13} /> : num}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-[#0F0F14]' : isDone ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', step > num ? 'bg-lime' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
      <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: Question;
  index: number;
  total: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isQuiz = question.type === 'quiz';

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide mt-0.5',
            isQuiz ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          )}
        >
          {isQuiz ? 'Quiz' : 'Open'}
        </span>
        <span className="text-xs text-gray-400 mt-0.5 shrink-0">#{index + 1}</span>
        <div className="flex-1" />
        {/* Reorder */}
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Переместить вверх"
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Переместить вниз"
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
          title="Удалить вопрос"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Prompt */}
      <textarea
        value={question.prompt}
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        placeholder="Текст вопроса..."
        rows={2}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition resize-none"
      />

      {/* Quiz options */}
      {isQuiz && (
        <div className="flex flex-col gap-1.5">
          {(question.quizOptions ?? ['', '', '', '']).map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctIndex === i}
                onChange={() => onChange({ ...question, correctIndex: i as 0 | 1 | 2 | 3 })}
                className="accent-lime shrink-0"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const opts = [...(question.quizOptions ?? ['', '', '', ''])] as [string, string, string, string];
                  opts[i] = e.target.value;
                  onChange({ ...question, quizOptions: opts });
                }}
                placeholder={`Вариант ${i + 1}${question.correctIndex === i ? ' (правильный)' : ''}`}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition',
                  question.correctIndex === i
                    ? 'border-lime/60 bg-lime/5 text-gray-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                )}
              />
            </label>
          ))}
          <p className="text-[11px] text-gray-400 mt-0.5">Выберите радио-кнопку у правильного варианта</p>
        </div>
      )}

      {/* Open answer */}
      {!isQuiz && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ожидаемый ответ / критерии</label>
          <textarea
            value={question.expectedAnswer ?? ''}
            onChange={(e) => onChange({ ...question, expectedAnswer: e.target.value })}
            placeholder="Образец ответа или критерии оценки..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

export function CreateCourseWizard({ open, onClose, onSuccess }: Props) {
  const router = useRouter();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');

  // Step 1 state
  const [title, setTitle] = useState('');
  const [courseSize, setCourseSize] = useState<CourseSize>('medium');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const isStep1Valid =
    title.trim().length > 0 &&
    files.length > 0 &&
    files.some((f) => f.status !== 'error');

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setWizardStep(1);
      setPhase('idle');
      setError('');
      setTitle('');
      setCourseSize('medium');
      setFiles([]);
      setValidationErrors({});
      setDraft(null);
      setQuestions([]);
    }
  }, [open]);

  // ── File handling ───────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
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
  }, [files]);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // ── Step 1: Submit (upload + parse via backend) ─────────────────────────────

  const handleStep1Submit = async () => {
    if (!isStep1Valid || phase !== 'idle') return;
    setPhase('uploading');
    setError('');

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('size', courseSize);
    for (const entry of files) {
      formData.append('files', entry.file, entry.file.name);
    }

    // Mark all files as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })));

    try {
      const res = await apiFetch('/api/courses/draft', {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets multipart boundary automatically
        headers: {},
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? data.message ?? 'Ошибка при загрузке файлов');
      }

      // Mark files as done
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const })));

      const payload = data as DraftPayload & { ok: boolean };
      setDraft(payload);
      setWizardStep(2);
      setPhase('generating');

      // Auto-trigger generation
      await handleGenerate(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('idle');
      setFiles((prev) => prev.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Загрузка прервана' } : f
      ));
    }
  };

  // ── Step 2: Generate questions ──────────────────────────────────────────────

  const handleGenerate = async (payload: DraftPayload) => {
    setPhase('generating');
    setError('');
    try {
      const res = await apiFetch('/api/training/generate', {
        method: 'POST',
        body: JSON.stringify({
          draftCourseId: payload.draftCourseId,
          title: title.trim(),
          size: courseSize,
          extractedText: payload.extractedText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? data.message ?? 'Ошибка генерации вопросов');
      }
      setQuestions(data.questions as Question[]);
      setPhase('editing');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('editing'); // still show editor, but empty
    }
  };

  // ── Question editing helpers ────────────────────────────────────────────────

  const updateQuestion = (idx: number, q: Question) => {
    setQuestions((prev) => prev.map((old, i) => (i === idx ? q : old)));
  };

  const deleteQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, newQuestion(type)]);
  };

  // ── Step 2: Finalize ────────────────────────────────────────────────────────

  const handleFinalize = async () => {
    if (!draft || phase !== 'editing') return;
    if (questions.length === 0) {
      setError('Добавьте хотя бы один вопрос перед созданием курса');
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
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? data.message ?? 'Ошибка сохранения курса');
      }
      setPhase('done');
      // Fetch final manifest and notify parent
      const manifestRes = await apiFetch(`/api/courses/${data.courseId}`);
      const manifestData = await manifestRes.json();
      const manifest = manifestData.manifest as CourseManifest;
      onSuccess(manifest);
      onClose();
      router.push(`/curator/courses/${data.courseId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase('editing');
    }
  };

  // ── Retry generation ────────────────────────────────────────────────────────

  const handleRetryGenerate = () => {
    if (draft) handleGenerate(draft);
  };

  if (!open) return null;

  const isRunning = phase === 'uploading' || phase === 'generating' || phase === 'saving';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-lime/15 flex items-center justify-center">
            <span className="font-bold text-sm text-[#0F0F14]">A</span>
          </div>
          <span className="font-semibold text-sm text-gray-900 hidden sm:block">Adapt</span>
        </div>

        {/* Progress bar */}
        <ProgressBar step={wizardStep} />

        {/* Close */}
        <button
          onClick={onClose}
          disabled={isRunning}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
          title="Закрыть"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left decorative panel (desktop only) */}
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col justify-between p-8 bg-gradient-to-b from-[#0F0F14] to-[#1a1a24] text-white">
          <div>
            <h2 className="text-xl font-bold mb-2 leading-tight">
              {wizardStep === 1 ? 'Загрузите материалы' : 'Ваш тренинг готов'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {wizardStep === 1
                ? 'Добавьте PDF, DOCX или TXT файлы. Мы извлечём текст и создадим вопросы с помощью AI.'
                : 'Отредактируйте вопросы, измените порядок и добавьте свои. Затем нажмите «Создать курс».'}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Файлы и параметры' },
              { step: 2, label: 'Тренинг и вопросы' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold',
                    wizardStep > step ? 'bg-lime text-[#0F0F14]' :
                    wizardStep === step ? 'bg-white text-[#0F0F14]' :
                    'bg-white/10 text-gray-500'
                  )}
                >
                  {wizardStep > step ? '✓' : step}
                </div>
                <span className={cn('text-sm', wizardStep >= step ? 'text-white' : 'text-gray-500')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* ══ STEP 1 ══════════════════════════════════════════════════════════ */}
          {wizardStep === 1 && (
            <div className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Новый курс</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Заполните параметры и загрузите файлы — мы сделаем остальное.
                </p>
              </div>

              {/* Error */}
              {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Название курса <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Онбординг нового сотрудника"
                  disabled={phase === 'uploading'}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime/50 focus:border-lime transition disabled:opacity-50"
                />
              </div>

              {/* Size */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Размер курса</label>
                <Select
                  value={courseSize}
                  onValueChange={(v) => setCourseSize(v as CourseSize)}
                  disabled={phase === 'uploading'}
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

              {/* Dropzone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Файлы <span className="text-red-400">*</span>
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    PDF, TXT, DOC, DOCX · до {formatFileSize(MAX_FILE_SIZE)}
                  </span>
                </label>
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
                    isDragging
                      ? 'border-lime bg-lime/5'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300',
                    phase === 'uploading' && 'pointer-events-none opacity-60'
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => phase !== 'uploading' && fileInputRef.current?.click()}
                >
                  <CloudUpload size={30} className={isDragging ? 'text-lime' : 'text-gray-300'} />
                  <p className="text-sm text-gray-500 text-center">
                    <span className="font-medium text-gray-700">Нажмите для выбора</span> или перетащите файлы
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) { addFiles(Array.from(e.target.files)); e.target.value = ''; }
                    }}
                  />
                </div>

                {/* Validation errors */}
                {Object.entries(validationErrors).map(([name, err]) => (
                  <p key={name} className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /><span><b>{name}:</b> {err}</span>
                  </p>
                ))}

                {/* File list */}
                {files.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {files.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm',
                          entry.status === 'error' ? 'border-red-200 bg-red-50' :
                          entry.status === 'done'  ? 'border-emerald-100 bg-emerald-50/50' :
                          'border-gray-100 bg-white'
                        )}
                      >
                        <span className="shrink-0">{fileIcon(entry.file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-gray-800 text-xs">{entry.file.name}</p>
                          <p className="text-gray-400 text-xs">{formatFileSize(entry.file.size)}</p>
                          {entry.status === 'error' && entry.error && (
                            <p className="text-red-500 text-xs mt-0.5">{entry.error}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {entry.status === 'uploading' && <Loader2 size={13} className="animate-spin text-blue-400" />}
                          {entry.status === 'done' && <CheckCircle2 size={13} className="text-emerald-500" />}
                          {entry.status === 'error' && <AlertCircle size={13} className="text-red-400" />}
                        </div>
                        {phase !== 'uploading' && (
                          <button
                            onClick={() => removeFile(entry.id)}
                            className="shrink-0 rounded-md p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleStep1Submit}
                disabled={!isStep1Valid || phase === 'uploading'}
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all',
                  isStep1Valid && phase === 'idle'
                    ? 'bg-lime text-[#0F0F14] hover:brightness-95 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {phase === 'uploading' && <Loader2 size={15} className="animate-spin" />}
                {phase === 'uploading' ? 'Загружаем файлы...' : 'Продолжить →'}
              </button>
            </div>
          )}

          {/* ══ STEP 2 ══════════════════════════════════════════════════════════ */}
          {wizardStep === 2 && (
            <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Тренинг и вопросы</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {phase === 'generating'
                    ? 'Генерируем вопросы с помощью Yandex AI Studio...'
                    : `${questions.length} вопрос${questions.length === 1 ? '' : questions.length < 5 ? 'а' : 'ов'}. Отредактируйте и создайте курс.`
                  }
                </p>
              </div>

              {/* Error */}
              {error && (
                <ErrorBanner
                  message={error}
                  onDismiss={() => setError('')}
                />
              )}

              {/* Generating loader */}
              {phase === 'generating' && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-lime/10 flex items-center justify-center">
                      <Loader2 size={28} className="animate-spin text-[#0F0F14]" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">Создаём тренинг…</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Yandex AI Studio анализирует материал и генерирует вопросы
                    </p>
                  </div>
                </div>
              )}

              {/* Question editor */}
              {(phase === 'editing' || phase === 'saving') && (
                <>
                  {/* Retry button if no questions generated */}
                  {questions.length === 0 && !error && (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <p className="text-gray-500 text-sm">Вопросы не были сгенерированы.</p>
                      <button
                        onClick={handleRetryGenerate}
                        className="px-4 py-2 rounded-xl bg-[#0F0F14] text-white text-sm font-medium hover:opacity-90 transition"
                      >
                        Попробовать ещё раз
                      </button>
                    </div>
                  )}

                  {/* Questions list */}
                  {questions.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {questions.map((q, idx) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={idx}
                          total={questions.length}
                          onChange={(updated) => updateQuestion(idx, updated)}
                          onDelete={() => deleteQuestion(idx)}
                          onMoveUp={() => moveUp(idx)}
                          onMoveDown={() => moveDown(idx)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add question buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => addQuestion('quiz')}
                      disabled={phase === 'saving'}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
                    >
                      <Plus size={13} />
                      Добавить Quiz
                    </button>
                    <button
                      onClick={() => addQuestion('open')}
                      disabled={phase === 'saving'}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
                    >
                      <Plus size={13} />
                      Добавить Open
                    </button>
                  </div>

                  {/* Finalize CTA */}
                  <div className="flex items-center gap-3 pt-2 pb-4">
                    <button
                      onClick={() => { setWizardStep(1); setPhase('idle'); setError(''); }}
                      disabled={phase === 'saving'}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      ← Назад
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={questions.length === 0 || phase === 'saving'}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        questions.length > 0 && phase !== 'saving'
                          ? 'bg-lime text-[#0F0F14] hover:brightness-95 shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {phase === 'saving' && <Loader2 size={14} className="animate-spin" />}
                      {phase === 'saving' ? 'Сохраняем курс...' : 'Создать курс'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
