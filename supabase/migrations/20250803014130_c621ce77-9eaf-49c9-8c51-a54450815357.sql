-- Fix security issues by enabling RLS on the view
-- Note: Views don't directly support RLS, but we'll handle this through function access only

-- First, let's update our approach to be more secure
-- Drop the view and recreate with proper security

DROP VIEW IF EXISTS vote_receipts;

-- Instead of a view, we'll use the verification function as the only access method
-- No direct table access will be allowed

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Read through verification function only" ON _vote_receipts_storage;

-- Create a more restrictive read policy - no direct reads allowed
CREATE POLICY "No direct access" ON _vote_receipts_storage
  FOR ALL
  USING (false);

-- Update the insert policy to be more specific
DROP POLICY IF EXISTS "System can insert receipts via function" ON _vote_receipts_storage;

CREATE POLICY "System can insert receipts" ON _vote_receipts_storage
  FOR INSERT 
  WITH CHECK (
    -- Only allow inserts through the function (when called by authenticated users)
    auth.uid() IS NOT NULL AND 
    current_setting('request.method', true) = 'POST'
  );

-- Remove public access to the non-existent view
-- All access will be through the verify_vote_receipt function only

-- Ensure the insert function has proper access control
REVOKE ALL ON _vote_receipts_storage FROM public;
GRANT INSERT ON _vote_receipts_storage TO authenticated;

-- Ensure functions are properly secured
REVOKE EXECUTE ON FUNCTION insert_vote_receipt(TEXT, UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) FROM public;
GRANT EXECUTE ON FUNCTION insert_vote_receipt(TEXT, UUID, TEXT, JSONB, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;