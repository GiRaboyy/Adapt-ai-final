/**
 * TypeScript types for the Adapt application
 */

export type UserRole = 'curator' | 'employee';

// ─── Course (Storage-based, no DB) ───────────────────────────────────────────

export type CourseSize = 'small' | 'medium' | 'large';

export type FileParseStatus = 'parsed' | 'skipped' | 'error';

export type CourseOverallStatus = 'processing' | 'ready' | 'partial' | 'error';

export interface CourseManifestFile {
  fileId: string;        // UUID filename in storage e.g. "abc.pdf"
  name: string;          // original file name
  type: string;          // MIME type
  size: number;          // bytes
  storagePath: string;   // path in bucket: {userId}/{courseId}/files/{fileId}
  parseStatus: FileParseStatus;
  parsedPath?: string;   // path in bucket: {userId}/{courseId}/parsed/{fileId}.txt
  parseError?: string;
}

// ─── Training / Questions ─────────────────────────────────────────────────────

export type QuestionType = 'quiz' | 'open';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  quizOptions?: [string, string, string, string];
  correctIndex?: 0 | 1 | 2 | 3;
  expectedAnswer?: string;
}

// ─── Course Manifest (Storage-based) ─────────────────────────────────────────

export interface CourseManifest {
  courseId: string;
  title: string;
  size: CourseSize;
  createdAt: string;          // ISO 8601
  overallStatus: CourseOverallStatus;
  textBytes: number;
  inviteCode: string;         // short 6-char alphanumeric code
  employeesCount: number;     // enrolled employees
  files: CourseManifestFile[];
  questions?: Question[];     // AI-generated training questions
  quizCount?: number;
  openCount?: number;
}

// ─── Draft (before finalization) ─────────────────────────────────────────────

export interface DraftUploadedFile {
  path: string;         // safe key e.g. "uuid.pdf"
  storagePath: string;  // full bucket path
  originalName: string;
  mime: string;
  size: number;
}

export interface DraftPayload {
  draftCourseId: string;
  uploadedFiles: DraftUploadedFile[];
  extractedText: string;
  extractedStats: { chars: number; filesCount: number; truncated: boolean };
}

export interface Profile {
  id: string;
  org_id: string | null;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
  };
}
