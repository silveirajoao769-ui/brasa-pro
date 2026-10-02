import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type BrasaSubscription = {
  plan: string | null;
  status: string | null;
  provider: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function isActivePro(subscription: BrasaSubscription | null | undefined) {
  if (subscription?.plan !== "pro" || subscription?.status !== "active") return false;

  if (subscription.cancel_at_period_end && subscription.current_period_end) {
    return new Date(subscription.current_period_end).getTime() > Date.now();
  }

  return true;
}

export async function getSubscription(
  supabase: ServerClient,
  userId: string,
): Promise<BrasaSubscription | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, provider, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function requirePro(
  supabase: ServerClient,
  userId: string,
  feature: string,
) {
  const subscription = await getSubscription(supabase, userId);

  if (!isActivePro(subscription)) {
    redirect("/plano?feature=" + encodeURIComponent(feature));
  }

  return subscription;
}
