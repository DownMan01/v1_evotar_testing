-- Fix the create_voting_session_safe function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.create_voting_session_safe(p_election_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_session_token TEXT;
  v_voter_id UUID;
  v_can_vote BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get current user
  v_voter_id := auth.uid();
  
  IF v_voter_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated',
      'session_token', null
    );
  END IF;
  
  -- Check if user can vote
  SELECT public.can_user_vote_in_election(v_voter_id, p_election_id) INTO v_can_vote;
  
  IF NOT v_can_vote THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not eligible to vote in this election',
      'session_token', null
    );
  END IF;
  
  -- Generate unique session token using gen_random_uuid
  v_session_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
  -- Insert or update voting session
  INSERT INTO public.voting_sessions (
    session_token,
    voter_id,
    election_id
  ) VALUES (
    v_session_token,
    v_voter_id,
    p_election_id
  )
  ON CONFLICT (voter_id, election_id) 
  DO UPDATE SET 
    session_token = v_session_token,
    created_at = now(),
    expires_at = now() + INTERVAL '24 hours'
  WHERE voting_sessions.has_voted = FALSE;
  
  RETURN jsonb_build_object(
    'success', true,
    'error', null,
    'session_token', v_session_token
  );
END;
$function$;