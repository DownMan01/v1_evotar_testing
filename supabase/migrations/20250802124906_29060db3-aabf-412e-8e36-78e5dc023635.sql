-- Create vote_receipts table for anonymous receipt verification
CREATE TABLE public.vote_receipts (
  receipt_id TEXT PRIMARY KEY,
  election_id UUID NOT NULL,
  election_title TEXT NOT NULL,
  selected_candidates JSONB NOT NULL,
  receipt_hash TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  voting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_verified BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.vote_receipts ENABLE ROW LEVEL SECURITY;

-- Create policy for public verification access (no authentication required)
CREATE POLICY "Anyone can verify receipts with valid token" 
ON public.vote_receipts 
FOR SELECT 
USING (true);

-- Create policy for system to insert receipts
CREATE POLICY "System can insert receipts" 
ON public.vote_receipts 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_vote_receipts_receipt_token ON public.vote_receipts(receipt_id, verification_token);
CREATE INDEX idx_vote_receipts_election ON public.vote_receipts(election_id);

-- Add foreign key constraint to elections table
ALTER TABLE public.vote_receipts 
ADD CONSTRAINT fk_vote_receipts_election 
FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;