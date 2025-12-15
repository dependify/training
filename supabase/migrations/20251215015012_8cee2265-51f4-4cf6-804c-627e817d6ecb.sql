-- Add explicit deny policies for user_roles table to prevent privilege escalation
-- These ensure only service role can modify roles

CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
USING (false);