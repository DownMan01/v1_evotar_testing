-- Update verify_vote_receipt function to use the new table
CREATE OR REPLACE FUNCTION public.verify_vote_receipt(
  p_receipt_id text, 
  p_verification_token text
)
RETURNS TABLE(
  receipt_id text, 
  election_id uuid, 
  election_title text, 
  selected_candidates jsonb, 
  voting_date timestamp with time zone, 
  created_at timestamp with time zone, 
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  FROM public.vote_receipts vr
  WHERE vr.receipt_id = p_receipt_id 
    AND vr.verification_token = p_verification_token;
END;
$function$;