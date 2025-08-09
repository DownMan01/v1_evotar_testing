-- Drop the existing vote_receipts table and recreate as optimized structure
-- First, backup any existing data (if any)
CREATE TABLE IF NOT EXISTS vote_receipts_backup AS SELECT * FROM vote_receipts;

-- Drop the original table
DROP TABLE IF EXISTS vote_receipts CASCADE;

-- Create the core receipt storage table (private, not directly accessible)
CREATE TABLE _vote_receipts_storage (
  receipt_id TEXT PRIMARY KEY,
  election_id UUID NOT NULL,
  election_title TEXT NOT NULL,
  selected_candidates JSONB NOT NULL,
  receipt_hash TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  voting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for optimal performance
CREATE INDEX idx_vote_receipts_verification ON _vote_receipts_storage(receipt_id, verification_token);
CREATE INDEX idx_vote_receipts_election ON _vote_receipts_storage(election_id);
CREATE INDEX idx_vote_receipts_created ON _vote_receipts_storage(created_at);

-- Create a read-only view that users will interact with
CREATE VIEW vote_receipts AS
SELECT 
  receipt_id,
  election_id,
  election_title,
  selected_candidates,
  receipt_hash,
  verification_token,
  voting_date,
  created_at
FROM _vote_receipts_storage;

-- Create a secure function to insert receipts (only way to add data)
CREATE OR REPLACE FUNCTION insert_vote_receipt(
  p_receipt_id TEXT,
  p_election_id UUID,
  p_election_title TEXT,
  p_selected_candidates JSONB,
  p_receipt_hash TEXT,
  p_verification_token TEXT,
  p_voting_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input data
  IF p_receipt_id IS NULL OR p_election_id IS NULL OR p_verification_token IS NULL THEN
    RAISE EXCEPTION 'Required fields cannot be null';
  END IF;
  
  -- Insert the receipt data
  INSERT INTO _vote_receipts_storage (
    receipt_id,
    election_id,
    election_title,
    selected_candidates,
    receipt_hash,
    verification_token,
    voting_date
  ) VALUES (
    p_receipt_id,
    p_election_id,
    p_election_title,
    p_selected_candidates,
    p_receipt_hash,
    p_verification_token,
    p_voting_date
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create optimized verification function
CREATE OR REPLACE FUNCTION verify_vote_receipt(
  p_receipt_id TEXT,
  p_verification_token TEXT
) RETURNS TABLE(
  receipt_id TEXT,
  election_id UUID,
  election_title TEXT,
  selected_candidates JSONB,
  voting_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vr.receipt_id,
    vr.election_id,
    vr.election_title,
    vr.selected_candidates,
    vr.voting_date,
    vr.created_at,
    TRUE as is_valid
  FROM _vote_receipts_storage vr
  WHERE vr.receipt_id = p_receipt_id 
    AND vr.verification_token = p_verification_token;
END;
$$;

-- Set up RLS policies (read-only access)
ALTER TABLE _vote_receipts_storage ENABLE ROW LEVEL SECURITY;

-- Only the insert function can add data (system level)
CREATE POLICY "System can insert receipts via function" ON _vote_receipts_storage
  FOR INSERT 
  WITH CHECK (current_setting('role') = 'postgres' OR has_role(auth.uid(), 'Administrator'::user_role));

-- No direct updates or deletes allowed
CREATE POLICY "No direct modifications" ON _vote_receipts_storage
  FOR UPDATE, DELETE
  USING (false);

-- Read access through the view only
CREATE POLICY "Read through verification function only" ON _vote_receipts_storage
  FOR SELECT
  USING (false); -- Force all reads through the verification function

-- Grant necessary permissions
GRANT SELECT ON vote_receipts TO public;
GRANT EXECUTE ON FUNCTION verify_vote_receipt(TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION insert_vote_receipt(TEXT, UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;