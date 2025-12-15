-- Add verification columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN verification_token TEXT,
ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;

-- Create unique index for verification token
CREATE UNIQUE INDEX idx_registrations_verification_token ON public.registrations(verification_token) WHERE verification_token IS NOT NULL;

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update registrations RLS to allow admins to read
DROP POLICY IF EXISTS "No public reads" ON public.registrations;

CREATE POLICY "Admins can read all registrations"
ON public.registrations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));