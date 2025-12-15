-- Create registrations table for Digital Skills Mastery Course
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,
  job_title TEXT,
  street_address TEXT,
  city TEXT,
  country TEXT,
  heard_about_us TEXT,
  future_interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (anyone can register)
CREATE POLICY "Anyone can register" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent public reads (only admin access via service role)
CREATE POLICY "No public reads" 
ON public.registrations 
FOR SELECT 
USING (false);