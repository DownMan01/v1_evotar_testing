-- Drop the old log_auth_event function that uses inet type for ip_address
-- This will resolve the function overloading conflict
DROP FUNCTION IF EXISTS public.log_auth_event(uuid, text, text, text, inet, text);

-- Ensure only the text version exists (this should already exist from previous migration)
-- The text version is what the frontend is calling and what we want to keep