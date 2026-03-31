import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
function getMembershipClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
  }
  return _client;
}

export interface Membership {
  email: string;
  plan: string;
  pro_until: string | null;
  paid_via: string | null;
  source: string | null;
}

export async function checkMembership(email: string): Promise<Membership | null> {
  if (!email) return null;

  const { data } = await getMembershipClient()
    .from("memberships")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (!data) return null;

  if (data.plan === "pro" && data.pro_until) {
    const expiry = new Date(data.pro_until);
    if (expiry < new Date()) {
      await getMembershipClient()
        .from("memberships")
        .update({ plan: "free", updated_at: new Date().toISOString() })
        .eq("email", email.toLowerCase());
      return { ...data, plan: "free" };
    }
  }

  return data;
}

export async function upsertMembership(
  email: string,
  plan: string,
  paid_via: string,
  pro_until?: string,
  stripe_customer_id?: string
): Promise<void> {
  await getMembershipClient().from("memberships").upsert(
    {
      email: email.toLowerCase(),
      plan,
      paid_via,
      pro_until: pro_until || null,
      stripe_customer_id: stripe_customer_id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );
}

export async function ensureMembership(
  email: string,
  source: string
): Promise<void> {
  const { data } = await getMembershipClient()
    .from("memberships")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (!data) {
    await getMembershipClient().from("memberships").insert({
      email: email.toLowerCase(),
      plan: "free",
      source,
    });
  }
}
