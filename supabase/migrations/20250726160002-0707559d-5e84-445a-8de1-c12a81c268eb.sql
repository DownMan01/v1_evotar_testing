-- Create profile update requests table
CREATE TABLE public.profile_update_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_email text,
  requested_email text,
  current_year_level text,
  requested_year_level text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_update_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile update requests"
ON public.profile_update_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile update requests"
ON public.profile_update_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff and admins can view all profile update requests"
ON public.profile_update_requests
FOR SELECT
USING (has_role(auth.uid(), 'Administrator'::user_role) OR has_role(auth.uid(), 'Staff'::user_role));

CREATE POLICY "Staff and admins can update profile update requests"
ON public.profile_update_requests
FOR UPDATE
USING (has_role(auth.uid(), 'Administrator'::user_role) OR has_role(auth.uid(), 'Staff'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_profile_update_requests_updated_at
BEFORE UPDATE ON public.profile_update_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to approve profile update requests
CREATE OR REPLACE FUNCTION public.approve_profile_update_request(p_request_id uuid, p_admin_notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Check if user is staff or admin
  IF NOT (has_role(auth.uid(), 'Administrator'::user_role) OR has_role(auth.uid(), 'Staff'::user_role)) THEN
    RAISE EXCEPTION 'Only staff and administrators can approve profile update requests';
  END IF;
  
  -- Get the pending request
  SELECT * INTO v_request
  FROM public.profile_update_requests
  WHERE id = p_request_id AND status = 'Pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile update request not found or already processed';
  END IF;
  
  -- Update the user's profile with approved changes
  UPDATE public.profiles
  SET 
    email = COALESCE(v_request.requested_email, email),
    year_level = COALESCE(v_request.requested_year_level, year_level),
    updated_at = now()
  WHERE user_id = v_request.user_id;
  
  -- Mark request as approved
  UPDATE public.profile_update_requests
  SET 
    status = 'Approved',
    admin_notes = p_admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id;
  
  -- Log the approval action
  PERFORM public.log_audit_action(
    auth.uid(),
    CASE 
      WHEN has_role(auth.uid(), 'Administrator'::user_role) THEN 'Administrator'::user_role
      ELSE 'Staff'::user_role
    END,
    'approve_profile_update',
    'profile_update_request',
    p_request_id,
    jsonb_build_object(
      'user_id', v_request.user_id,
      'email_change', CASE WHEN v_request.requested_email IS NOT NULL THEN jsonb_build_object('from', v_request.current_email, 'to', v_request.requested_email) ELSE null END,
      'year_level_change', CASE WHEN v_request.requested_year_level IS NOT NULL THEN jsonb_build_object('from', v_request.current_year_level, 'to', v_request.requested_year_level) ELSE null END
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to reject profile update requests
CREATE OR REPLACE FUNCTION public.reject_profile_update_request(p_request_id uuid, p_admin_notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Check if user is staff or admin
  IF NOT (has_role(auth.uid(), 'Administrator'::user_role) OR has_role(auth.uid(), 'Staff'::user_role)) THEN
    RAISE EXCEPTION 'Only staff and administrators can reject profile update requests';
  END IF;
  
  -- Get the pending request
  SELECT * INTO v_request
  FROM public.profile_update_requests
  WHERE id = p_request_id AND status = 'Pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile update request not found or already processed';
  END IF;
  
  -- Mark request as rejected
  UPDATE public.profile_update_requests
  SET 
    status = 'Rejected',
    admin_notes = p_admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id;
  
  -- Log the rejection action
  PERFORM public.log_audit_action(
    auth.uid(),
    CASE 
      WHEN has_role(auth.uid(), 'Administrator'::user_role) THEN 'Administrator'::user_role
      ELSE 'Staff'::user_role
    END,
    'reject_profile_update',
    'profile_update_request',
    p_request_id,
    jsonb_build_object(
      'user_id', v_request.user_id,
      'reason', p_admin_notes
    )
  );
  
  RETURN TRUE;
END;
$$;