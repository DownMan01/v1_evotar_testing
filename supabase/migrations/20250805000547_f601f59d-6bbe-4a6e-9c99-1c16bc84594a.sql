-- Fix security definer view issue by recreating without security definer
DROP VIEW public._vote_receipts_storage;

-- Create _vote_receipts_storage as a regular view (not security definer)
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