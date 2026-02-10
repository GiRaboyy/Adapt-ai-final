/**
 * TypeScript types for the Adapt application
 */

export type UserRole = 'curator' | 'employee';

// ─── Course (Storage-based, no DB) ───────────────────────────────────────────

export type CourseSize = 'small' | 'medium' | 'large';

export type FileParseStatus = 'parsed' | 'skipped' | 'error';

export type CourseOverallStatus = 'processing' | 'ready' | 'partial' | 'error';

export interface CourseManifestFile {
  name: string;          // original file name
  type: string;          // MIME type
  size: number;          // bytes
  storagePath: string;   // path in bucket: {userId}/{courseId}/files/{name}
  parseStatus: FileParseStatus;
  parsedPath?: string;   // path in bucket: {userId}/{courseId}/parsed/{name}.txt
  parseError?: string;
}

export interface CourseManifest {
  courseId: string;
  title: string;
  size: CourseSize;
  createdAt: string;          // ISO 8601
  overallStatus: CourseOverallStatus;
  textBytes: number;
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
