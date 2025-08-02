-- Create a function to get profile update requests with user details
CREATE OR REPLACE FUNCTION public.get_profile_update_requests_with_user_details()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  current_email text,
  requested_email text,
  current_year_level text,
  requested_year_level text,
  status text,
  admin_notes text,
  requested_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  full_name text,
  student_id text,
  course text,
  year_level text,
  gender text,
  id_image_url text,
  email text,
  registration_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pur.id,
    pur.user_id,
    pur.current_email,
    pur.requested_email,
    pur.current_year_level,
    pur.requested_year_level,
    pur.status,
    pur.admin_notes,
    pur.requested_at,
    pur.reviewed_at,
    pur.reviewed_by,
    pur.created_at,
    pur.updated_at,
    p.full_name,
    p.student_id,
    p.course,
    p.year_level,
    p.gender,
    p.id_image_url,
    p.email,
    p.registration_status
  FROM public.profile_update_requests pur
  LEFT JOIN public.profiles p ON pur.user_id = p.user_id
  ORDER BY pur.requested_at DESC;
$$;