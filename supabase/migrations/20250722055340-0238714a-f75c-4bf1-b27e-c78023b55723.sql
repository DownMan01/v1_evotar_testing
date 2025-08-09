-- Fix voting system to prevent duplicate votes and sessions

-- First, clean up any duplicate voting sessions (keep the latest one per voter per election)
DELETE FROM public.voting_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (voter_id, election_id) id 
  FROM public.voting_sessions 
  ORDER BY voter_id, election_id, created_at DESC
);

-- Add unique constraint to prevent multiple voting sessions per voter per election
ALTER TABLE public.voting_sessions 
ADD CONSTRAINT unique_voter_election_session 
UNIQUE (voter_id, election_id);

-- Add unique constraint to prevent duplicate votes per voter per election per position
-- First get all position_ids from candidates table for the constraint
ALTER TABLE public.votes 
ADD COLUMN position_id uuid;

-- Update existing votes with position_id from candidates table
UPDATE public.votes 
SET position_id = c.position_id
FROM public.candidates c
WHERE votes.candidate_id = c.id;

-- Make position_id NOT NULL after updating
ALTER TABLE public.votes 
ALTER COLUMN position_id SET NOT NULL;

-- Add unique constraint to prevent multiple votes per voter per position per election
ALTER TABLE public.votes 
ADD CONSTRAINT unique_voter_position_election 
UNIQUE (voter_id, position_id, election_id);

-- Update the cast_multiple_anonymous_votes function to include position_id in votes
CREATE OR REPLACE FUNCTION public.cast_multiple_anonymous_votes(
  p_session_token text, 
  p_votes jsonb, -- Array of {candidate_id, position_id, election_id}
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
      position_id,
      election_id
    ) VALUES (
      v_session_record.voter_id,
      (v_vote->>'candidate_id')::uuid,
      (v_vote->>'position_id')::uuid,
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