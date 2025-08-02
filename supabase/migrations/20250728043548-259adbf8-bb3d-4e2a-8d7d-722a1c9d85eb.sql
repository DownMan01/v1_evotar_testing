-- Update log_auth_event function to properly handle IP address passed from frontend
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id uuid, 
  p_action text, 
  p_user_email text DEFAULT NULL::text, 
  p_user_name text DEFAULT NULL::text,
  p_ip_address text DEFAULT NULL::text,  -- Changed from inet to text to handle frontend-passed IP
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_ip_address inet;
BEGIN
  -- Get user profile details if not provided
  IF p_user_email IS NULL OR p_user_name IS NULL THEN
    SELECT email, full_name, role INTO v_profile
    FROM public.profiles 
    WHERE user_id = p_user_id;
    
    p_user_email := COALESCE(p_user_email, v_profile.email);
    p_user_name := COALESCE(p_user_name, v_profile.full_name);
  END IF;

  -- Convert IP address string to inet type if provided
  IF p_ip_address IS NOT NULL AND p_ip_address != '' THEN
    BEGIN
      v_ip_address := p_ip_address::inet;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, set to null
      v_ip_address := NULL;
    END;
  ELSE
    v_ip_address := NULL;
  END IF;

  -- Log the authentication event with IP and user agent
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
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
    ),
    v_ip_address,
    p_user_agent
  );
END;
$$;