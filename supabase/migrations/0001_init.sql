-- Adapt MVP - Initial Database Schema
-- Migration: 0001_init.sql
-- Description: Creates core tables for organizations, profiles, courses, enrollments, and documents

-- Note: Using gen_random_uuid() which is built into PostgreSQL 13+
-- No extension needed for UUID generation

-- =============================================================================
-- A. System Tables
-- =============================================================================

-- app_meta: System metadata and health check table
CREATE TABLE IF NOT EXISTS app_meta (
    id INTEGER PRIMARY KEY DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schema_version TEXT,
    notes TEXT,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert initial row
INSERT INTO app_meta (id, schema_version, notes)
VALUES (1, '0001_init', 'Initial schema creation')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- B. Organizations and Profiles
-- =============================================================================

-- organizations: Company/organization entities
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

-- profiles: User profiles (curators and employees)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('curator', 'employee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =============================================================================
-- C. Courses and Content
-- =============================================================================

-- courses: Training courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L')),
    quiz_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_org_id ON courses(org_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- course_items: Questions within courses
CREATE TABLE IF NOT EXISTS course_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'open')),
    prompt TEXT NOT NULL,
    options JSONB,
    correct_option INTEGER,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT quiz_has_options CHECK (
        (type = 'quiz' AND options IS NOT NULL AND correct_option IS NOT NULL) OR
        (type = 'open')
    )
);

CREATE INDEX IF NOT EXISTS idx_course_items_course_id ON course_items(course_id);
CREATE INDEX IF NOT EXISTS idx_course_items_order ON course_items(course_id, order_index);

-- enrollments: Employee course enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('invited', 'in_progress', 'completed')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_enrollment UNIQUE (course_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_employee_id ON enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- answers: Student answers to course questions
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    course_item_id UUID NOT NULL REFERENCES course_items(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_option INTEGER,
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_answer UNIQUE (enrollment_id, course_item_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_enrollment_id ON answers(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_answers_course_item_id ON answers(course_item_id);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON answers(created_at DESC);

-- =============================================================================
-- D. Promo Codes and Usage Limits
-- =============================================================================

-- promo_codes: Promotional codes for feature access
CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    max_courses INTEGER,
    max_employees INTEGER,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON promo_codes(expires_at);

-- org_usage: Organization usage tracking
CREATE TABLE IF NOT EXISTS org_usage (
    org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    courses_created INTEGER NOT NULL DEFAULT 0,
    employees_connected INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- E. File Management
-- =============================================================================

-- documents: Uploaded files and their metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- =============================================================================
-- Migration Complete
-- =============================================================================

COMMENT ON TABLE app_meta IS 'System metadata and version tracking';
COMMENT ON TABLE organizations IS 'Company/organization entities';
COMMENT ON TABLE profiles IS 'User profiles for curators and employees';
COMMENT ON TABLE courses IS 'Training courses with AI-generated content';
COMMENT ON TABLE course_items IS 'Individual questions within courses';
COMMENT ON TABLE enrollments IS 'Employee course enrollments and progress';
COMMENT ON TABLE answers IS 'Student responses to course questions';
COMMENT ON TABLE promo_codes IS 'Promotional codes for feature access';
COMMENT ON TABLE org_usage IS 'Organization usage metrics';
COMMENT ON TABLE documents IS 'Uploaded documents and file metadata';
