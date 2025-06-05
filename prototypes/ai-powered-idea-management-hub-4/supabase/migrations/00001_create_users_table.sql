-- Migration: Create users table and related objects
-- Timestamp: {{ YYYYMMDDHHMMSS }} (Placeholder for actual timestamp)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create public.users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE, -- Can be sourced from auth.users.email
    full_name TEXT,
    roles JSONB DEFAULT '["Contributor"]'::jsonb, -- Store roles as a JSON array
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    preferences JSONB,
    organisation_id UUID, -- For future multi-tenancy, can add FK later
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Stores public user profile information, extending auth.users.';
COMMENT ON COLUMN public.users.id IS 'References the user ID from Supabase auth.users table.';
COMMENT ON COLUMN public.users.roles IS 'Application-specific roles for the user, e.g., ["Contributor", "Admin"].';

-- 2. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Trigger to update updated_at on users table
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Function to copy email from auth.users to public.users on new user creation
-- This helps keep the email in sync if it's needed directly in public.users
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, roles)
    VALUES (NEW.id, NEW.email, '["Contributor"]'::jsonb)
    ON CONFLICT (id) DO UPDATE SET email = NEW.email; -- Update email if user somehow exists
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger on auth.users to sync new users to public.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();

-- 6. Row Level Security (RLS) Policies for public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Allow individual user to read their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (specific columns)
CREATE POLICY "Allow individual user to update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    -- Consider restricting which columns can be updated by non-admins, e.g.,
    -- full_name, profile_picture_url, preferences. Roles should be admin-managed.

-- Admins can manage all user profiles (assuming an admin role check mechanism)
-- This policy requires a helper function to check user's application role.
-- Create a placeholder function `is_admin()` or use a custom claim in JWT.
-- For simplicity, this example assumes a custom claim 'app_role' or similar.
-- Or, if roles are in public.users.roles:
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles JSONB;
BEGIN
    SELECT roles INTO user_roles FROM public.users WHERE id = user_id;
    RETURN user_roles @> '["Admin"]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Allow admins to manage all user data"
    ON public.users
    FOR ALL -- SELECT, INSERT, UPDATE, DELETE
    USING (public.is_user_admin(auth.uid()))
    WITH CHECK (public.is_user_admin(auth.uid()));

-- Ensure authenticated users can select users (e.g., for mentions, assignments)
-- This might be too permissive depending on requirements.
CREATE POLICY "Allow authenticated users to read user profiles"
    ON public.users
    FOR SELECT
    TO authenticated -- Or specific roles
    USING (true);


-- Seed initial admin user if needed (manual step or separate script)
-- Example: Update a specific user to have Admin role after they sign up.
-- UPDATE public.users SET roles = '["Admin"]'::jsonb WHERE email = 'admin@example.com';

-- Note: The handle_new_user_sync function and its trigger assume that when a user
-- signs up via Supabase Auth, an entry should be automatically created in public.users.
-- If users are created/managed differently, this trigger might need adjustment.
-- The SECURITY DEFINER on functions is important for them to operate with elevated privileges
-- when necessary (e.g., inserting into public.users when auth.users trigger fires).
