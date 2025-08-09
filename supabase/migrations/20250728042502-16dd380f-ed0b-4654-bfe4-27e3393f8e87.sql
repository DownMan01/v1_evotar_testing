-- Fix RLS policies for audit_logs - Staff should see ALL activity, not just their own
-- Drop current staff policy that only shows their own logs
DROP POLICY IF EXISTS "Staff can view their own logs" ON public.audit_logs;

-- Create new policy for staff to view ALL logs (like administrators)
CREATE POLICY "Staff can view all logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'Staff'::user_role) OR has_role(auth.uid(), 'Administrator'::user_role));

-- The policies are now:
-- 1. Voters: see only their own logs 
-- 2. Staff: see ALL logs (voters + staff + admin activity)
-- 3. Admin: see ALL logs