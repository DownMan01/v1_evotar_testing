-- Remove duplicate foreign key constraints to fix the election loading issue
-- First, let's check and remove the duplicate foreign key constraint
DO $$ 
BEGIN
    -- Drop the duplicate foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_positions_election' 
        AND table_name = 'positions'
    ) THEN
        ALTER TABLE public.positions DROP CONSTRAINT fk_positions_election;
    END IF;
    
    -- Also check for candidates table foreign key issues
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_candidates_position' 
        AND table_name = 'candidates'
    ) THEN
        ALTER TABLE public.candidates DROP CONSTRAINT fk_candidates_position;
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_candidates_election' 
        AND table_name = 'candidates'
    ) THEN
        ALTER TABLE public.candidates DROP CONSTRAINT fk_candidates_election;
    END IF;
END $$;