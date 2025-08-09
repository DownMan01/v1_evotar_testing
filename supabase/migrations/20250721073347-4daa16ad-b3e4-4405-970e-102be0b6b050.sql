-- Fix the voting flow issue where session becomes invalid after first vote
-- The problem is that cast_anonymous_vote marks session as used immediately
-- but we need to cast multiple votes (one per position) in the same session

-- Create a new function that handles multiple votes at once
CREATE OR REPLACE FUNCTION public.cast_multiple_anonymous_votes(
  p_session_token text, 
  p_votes jsonb, -- Array of {candidate_id, election_id, position_id}
  p_election_id uuid
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_session_record RECORD;
  v_vote jsonb;
BEGIN
  -- Verify session exists and is valid
  SELECT * INTO v_session_record
  FROM public.voting_sessions
  WHERE session_token = p_session_token
    AND election_id = p_election_id
    AND expires_at > now()
    AND has_voted = FALSE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired voting session';
  END IF;
  
  -- Insert all votes atomically
  FOR v_vote IN SELECT * FROM jsonb_array_elements(p_votes)
  LOOP
    INSERT INTO public.votes (
      voter_id,
      candidate_id,
      election_id
    ) VALUES (
      v_session_record.voter_id,
      (v_vote->>'candidate_id')::uuid,
      p_election_id
    );
    
    -- Log each voting action (without revealing voter identity)
    PERFORM public.log_audit_action(
      NULL, -- No actor_id to maintain anonymity
      'Voter',
      'cast_vote',
      'election',
      p_election_id,
      jsonb_build_object(
        'position_id', (v_vote->>'position_id')::uuid,
        'candidate_id', (v_vote->>'candidate_id')::uuid
      )
    );
  END LOOP;
  
  -- Mark session as used only after ALL votes are cast
  UPDATE public.voting_sessions
  SET has_voted = TRUE
  WHERE session_token = p_session_token;
  
  RETURN TRUE;
END;
$$;