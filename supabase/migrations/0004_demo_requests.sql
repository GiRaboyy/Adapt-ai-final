-- Create demo_requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  telegram TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'declined')),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_requests_status_created
  ON demo_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email
  ON demo_requests(email);

-- Enable RLS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage
CREATE POLICY "Service role can manage demo requests"
  ON demo_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON demo_requests TO service_role;

-- Comment
COMMENT ON TABLE demo_requests IS 'Landing page demo request submissions';
