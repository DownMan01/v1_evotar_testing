-- Update functions to use the new vote_receipts table and fix security issue

-- Update the insert_vote_receipt function to use the new table
CREATE OR REPLACE FUNCTION public.insert_vote_receipt(
  p_receipt_id text, 
  p_election_id uuid, 
  p_election_title text, 
  p_selected_candidates jsonb, 
  p_receipt_hash text, 
  p_verification_token text, 
  p_voting_date timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input data
  IF p_receipt_id IS NULL OR p_election_id IS NULL OR p_verification_token IS NULL THEN
    RAISE EXCEPTION 'Required fields cannot be null';
  END IF;
  
  -- Insert the receipt data into the base table
  INSERT INTO public.vote_receipts (
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
$function$;