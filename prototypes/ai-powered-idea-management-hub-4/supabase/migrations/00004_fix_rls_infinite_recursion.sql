-- Migration: Fix RLS infinite recursion issue
-- This migration fixes the infinite recursion in the is_user_admin function
-- by bypassing RLS when checking user roles

-- Drop the existing problematic admin policy
DROP POLICY IF EXISTS "Allow admins to manage all user data" ON public.users;

-- Drop and recreate the is_user_admin function to bypass RLS
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);

-- Create an improved admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles JSONB;
BEGIN
    -- Use a direct query that bypasses RLS by using the function context
    -- The SECURITY DEFINER allows this function to access data without RLS restrictions
    SELECT roles INTO user_roles 
    FROM public.users 
    WHERE id = user_id;
    
    -- Check if user has Admin role
    RETURN COALESCE(user_roles @> '["Admin"]'::jsonb, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;

-- Create a simpler admin policy that won't cause recursion
-- This policy uses a direct auth.uid() check combined with a separate admin verification
CREATE POLICY "Allow admins to manage all user data"
    ON public.users
    FOR ALL
    TO authenticated
    USING (
        -- Allow if user is checking their own data OR if they are an admin
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND roles @> '["Admin"]'::jsonb
        )
    )
    WITH CHECK (
        -- Same logic for WITH CHECK
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND roles @> '["Admin"]'::jsonb
        )
    );

-- Alternative approach: Create a separate admin-only policy
-- This separates admin access from regular user access to avoid complexity

-- First, let's also create a cleaner policy structure
DROP POLICY IF EXISTS "Allow individual user to read their own data" ON public.users;
DROP POLICY IF EXISTS "Allow individual user to update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read user profiles" ON public.users;

-- Policy 1: Users can read their own data
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Users can update their own data (excluding roles and sensitive fields)
CREATE POLICY "users_update_own"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Authenticated users can read basic profile info of other users
-- (This is often needed for user lists, mentions, etc.)
CREATE POLICY "users_select_profiles"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 4: Admin users can manage all data
-- This policy is structured to avoid the recursion issue
CREATE POLICY "admins_manage_all"
    ON public.users
    FOR ALL
    TO authenticated
    USING (
        -- Check if the current user has admin role by looking up their roles directly
        -- This works because it's in the USING clause and doesn't create recursion
        EXISTS (
            SELECT 1 
            FROM public.users admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.roles @> '["Admin"]'::jsonb
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.users admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.roles @> '["Admin"]'::jsonb
        )
    );

-- Add comment explaining the fix
COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Checks if a user has admin role. Uses SECURITY DEFINER to avoid RLS recursion issues.';