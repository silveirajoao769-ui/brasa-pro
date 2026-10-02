import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabaseEnv: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    supabaseQuery: false,
    checkoutConfigured: Boolean(process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL),
    aiDisabledByDefault: process.env.AI_BRASA_ENABLED !== "true",
  };

  if (checks.supabaseEnv) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("recipes").select("id").limit(1);
      checks.supabaseQuery = !error;
    } catch {
      checks.supabaseQuery = false;
    }
  }

  const healthy =
    checks.supabaseEnv &&
    checks.supabaseQuery &&
    checks.checkoutConfigured;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
