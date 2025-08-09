-- Fix RLS policies for audit_logs - Staff should see voter activity and their own activity, but NOT admin activity
-- Drop current staff policy
DROP POLICY IF EXISTS "Staff can view all logs" ON public.audit_logs;

-- Create new policy for staff to view voter logs and their own logs, but exclude admin activity
CREATE POLICY "Staff can view voter and staff logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'Staff'::user_role) 
  AND actor_role IN ('Voter'::user_role, 'Staff'::user_role)
);

-- The policies are now:
-- 1. Voters: see only their own logs 
-- 2. Staff: see voter activity + staff activity (excluding admin activity)
-- 3. Admin: see ALL logs (including admin activity)