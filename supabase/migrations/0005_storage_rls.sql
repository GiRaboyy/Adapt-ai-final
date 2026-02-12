-- Storage RLS policies for bucket "courses"
-- Allows authenticated users to manage files only within their own folder
-- (path must start with their auth.uid()).
-- The backend uses the service-role key and bypasses RLS entirely.

-- ── INSERT ────────────────────────────────────────────────────────────────────
CREATE POLICY "courses: authenticated insert own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'courses'
  AND name LIKE (auth.uid()::text || '/%')
);

-- ── UPDATE (required for upsert:true) ─────────────────────────────────────────
CREATE POLICY "courses: authenticated update own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'courses'
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'courses'
  AND name LIKE (auth.uid()::text || '/%')
);

-- ── SELECT ────────────────────────────────────────────────────────────────────
CREATE POLICY "courses: authenticated select own folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'courses'
  AND name LIKE (auth.uid()::text || '/%')
);

-- ── DELETE ────────────────────────────────────────────────────────────────────
CREATE POLICY "courses: authenticated delete own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'courses'
  AND name LIKE (auth.uid()::text || '/%')
);
