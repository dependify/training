import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
}

// Validate token format (should be UUID-like)
function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 10 || token.length > 100) return false;
  // Basic alphanumeric and dash check for UUID format
  return /^[a-zA-Z0-9-]+$/.test(token);
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  entry.count++;
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting (fallback to 'unknown')
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Apply rate limiting
    if (isRateLimited(clientIP)) {
      console.warn("Rate limited:", clientIP);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { token }: VerifyRequest = await req.json();

    // Validate token format
    if (!validateToken(token)) {
      console.error("Invalid token format");
      return new Response(
        JSON.stringify({ error: "Invalid verification token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying token for IP:", clientIP);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find registration with this token
    const { data: registration, error: findError } = await supabase
      .from("registrations")
      .select("*")
      .eq("verification_token", token)
      .maybeSingle();

    if (findError) {
      console.error("Database error:", findError);
      throw new Error("Database error occurred");
    }

    if (!registration) {
      throw new Error("Invalid or expired verification link");
    }

    if (registration.verified) {
      return new Response(
        JSON.stringify({ success: true, message: "Email already verified" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update registration as verified
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to verify email");
    }

    console.log("Email verified successfully for:", registration.email);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
