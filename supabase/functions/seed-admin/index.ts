import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-seed-token",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tokenHeader = req.headers.get("x-seed-token") || "";
    const expectedToken = Deno.env.get("ADMIN_SEED_TOKEN") || "";
    if (!expectedToken || tokenHeader !== expectedToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const role = (body?.role ?? "admin").toString();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;

    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (list.error) {
      return new Response(
        JSON.stringify({ error: "Failed to list users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const found = list.data?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
    if (found) {
      userId = found.id;
    } else {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "User not found and password missing to create" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      userId = created.data.user?.id ?? null;
    }

    const { error: roleError, data: roleData } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId!, role }, { onConflict: "user_id,role" })
      .select("id, user_id, role")
      .maybeSingle();

    if (roleError) {
      return new Response(
        JSON.stringify({ error: "Failed to assign role" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, role: roleData?.role || role }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

