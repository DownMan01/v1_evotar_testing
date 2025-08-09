-- Enhance audit_logs table with better RLS policies and login/logout tracking

-- Update RLS policies for audit_logs to allow staff to view logs
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'Staff'::user_role) OR has_role(auth.uid(), 'Administrator'::user_role));

-- Create a function to log user authentication events (login/logout)
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id uuid,
  p_action text,
  p_user_email text DEFAULT NULL,
  p_user_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Get user profile details if not provided
  IF p_user_email IS NULL OR p_user_name IS NULL THEN
    SELECT email, full_name, role INTO v_profile
    FROM public.profiles 
    WHERE user_id = p_user_id;
    
    p_user_email := COALESCE(p_user_email, v_profile.email);
    p_user_name := COALESCE(p_user_name, v_profile.full_name);
  END IF;

  -- Log the authentication event
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    COALESCE((SELECT role FROM public.profiles WHERE user_id = p_user_id), 'Voter'::user_role),
    p_action,
    'authentication',
    p_user_id,
    jsonb_build_object(
      'actor_name', p_user_name,
      'actor_username', p_user_email,
      'timestamp', now()
    )
  );
END;
$$;

-- Create a function to log voter activities (profile updates, appeals, etc.)
CREATE OR REPLACE FUNCTION public.log_voter_activity(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Get user profile details
  SELECT email, full_name, role INTO v_profile
  FROM public.profiles 
  WHERE user_id = p_user_id;

  -- Log the voter activity
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    COALESCE(v_profile.role, 'Voter'::user_role),
    p_action,
    p_resource_type,
    p_resource_id,
    jsonb_build_object(
      'actor_name', v_profile.full_name,
      'actor_username', v_profile.email,
      'timestamp', now()
    ) || COALESCE(p_details, '{}'::jsonb)
  );
END;
$$;