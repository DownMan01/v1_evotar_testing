-- Add 2FA fields to profiles table for staff/admin only
ALTER TABLE public.profiles 
ADD COLUMN two_factor_enabled boolean DEFAULT false,
ADD COLUMN two_factor_secret text,
ADD COLUMN two_factor_recovery_codes text[];

-- Add step-up verification tracking
CREATE TABLE public.step_up_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  action_type text NOT NULL,
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on step_up_verifications
ALTER TABLE public.step_up_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for step_up_verifications
CREATE POLICY "Users can view their own step-up verifications"
ON public.step_up_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own step-up verifications"
ON public.step_up_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to clean up expired step-up verifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_step_up_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.step_up_verifications
  WHERE expires_at < now();
END;
$$;

-- Create function to verify step-up authentication
CREATE OR REPLACE FUNCTION public.verify_step_up_auth(
  p_user_id uuid,
  p_action_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_verification RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Check if user requires 2FA (only staff and admin)
  IF v_profile.role NOT IN ('Staff', 'Administrator') THEN
    RETURN true; -- Voters don't need step-up auth
  END IF;
  
  -- If 2FA is not enabled, return true
  IF NOT v_profile.two_factor_enabled THEN
    RETURN true;
  END IF;
  
  -- Check for valid step-up verification
  SELECT * INTO v_verification
  FROM public.step_up_verifications
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN FOUND;
END;
$$;