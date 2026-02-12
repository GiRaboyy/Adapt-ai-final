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
