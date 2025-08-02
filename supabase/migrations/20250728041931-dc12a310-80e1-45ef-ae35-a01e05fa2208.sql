-- Fix RLS policies for audit_logs to ensure proper access control
-- Drop conflicting policies
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Voter can view their logs" ON public.audit_logs;

-- Create clean, non-overlapping policies
-- Voters can only see their own logs
CREATE POLICY "Voters can view their own logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  auth.uid() = actor_id 
  AND has_role(auth.uid(), 'Voter'::user_role)
);

-- Staff can only see their own logs (not all logs)
CREATE POLICY "Staff can view their own logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  auth.uid() = actor_id 
  AND has_role(auth.uid(), 'Staff'::user_role)
);

-- Administrators can view all logs
CREATE POLICY "Administrators can view all logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'Administrator'::user_role));

-- Update log_auth_event function to capture real IP address from the request
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id uuid, 
  p_action text, 
  p_user_email text DEFAULT NULL::text, 
  p_user_name text DEFAULT NULL::text,
  p_ip_address inet DEFAULT NULL::inet,
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

  -- Capture real IP address from the request
  -- In Supabase, we can get the real IP from the request headers
  v_ip_address := COALESCE(p_ip_address, inet(current_setting('request.header.x-real-ip', true)));
  
  -- If x-real-ip is not available, try x-forwarded-for
  IF v_ip_address IS NULL THEN
    v_ip_address := inet(split_part(current_setting('request.header.x-forwarded-for', true), ',', 1));
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