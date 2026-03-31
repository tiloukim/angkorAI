-- Central memberships table — shared across AngkorAI, AngkorCredit, AngkorX, Snaeh
CREATE TABLE IF NOT EXISTS memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  pro_until timestamptz,
  paid_via text CHECK (paid_via IN ('angkorai', 'angkorcredit', 'angkorx', 'snaeh')),
  source text CHECK (source IN ('angkorai', 'angkorcredit', 'angkorx', 'snaeh')),
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);

-- RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON memberships
  FOR ALL USING (true) WITH CHECK (true);
