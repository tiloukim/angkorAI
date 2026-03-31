import { createClient } from "@supabase/supabase-js";

// Central membership database (this IS the AngkorAI Supabase)
const membershipClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface Membership {
  email: string;
  plan: string;
  pro_until: string | null;
  paid_via: string | null;
  source: string | null;
}

export async function checkMembership(email: string): Promise<Membership | null> {
  if (!email) return null;

  const { data } = await membershipClient
    .from("memberships")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (!data) return null;

  if (data.plan === "pro" && data.pro_until) {
    const expiry = new Date(data.pro_until);
    if (expiry < new Date()) {
      await membershipClient
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
  await membershipClient.from("memberships").upsert(
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
  const { data } = await membershipClient
    .from("memberships")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (!data) {
    await membershipClient.from("memberships").insert({
      email: email.toLowerCase(),
      plan: "free",
      source,
    });
  }
}
