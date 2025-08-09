-- Make _vote_receipts_storage a read-only view without using vote_receipts_backup

-- First, create a new table to store the actual receipt data
CREATE TABLE public.vote_receipts (
  receipt_id text NOT NULL PRIMARY KEY,
  election_id uuid NOT NULL,
  election_title text NOT NULL,
  selected_candidates jsonb NOT NULL,
  receipt_hash text NOT NULL,
  verification_token text NOT NULL,
  voting_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.vote_receipts ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies similar to the original table
CREATE POLICY "No direct access to vote_receipts" 
ON public.vote_receipts 
FOR ALL 
TO public 
USING (false);

CREATE POLICY "System can insert receipts" 
ON public.vote_receipts 
FOR INSERT 
TO public 
WITH CHECK ((auth.uid() IS NOT NULL));

-- Migrate existing data from _vote_receipts_storage to vote_receipts
INSERT INTO public.vote_receipts (
  receipt_id, election_id, election_title, selected_candidates, 
  receipt_hash, verification_token, voting_date, created_at
)
SELECT 
  receipt_id, election_id, election_title, selected_candidates,
  receipt_hash, verification_token, voting_date, created_at
FROM public._vote_receipts_storage;

-- Drop the original table
DROP TABLE public._vote_receipts_storage;

-- Create _vote_receipts_storage as a read-only view
CREATE VIEW public._vote_receipts_storage AS
SELECT 
  receipt_id,
  election_id,
  election_title,
  selected_candidates,
  receipt_hash,
  verification_token,
  voting_date,
  created_at
FROM public.vote_receipts;