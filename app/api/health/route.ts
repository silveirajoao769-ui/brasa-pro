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
    checkoutConfigured: Boolean(
      process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL ||
      "https://pay.cakto.com.br/6pdqeej_1163437"
    ),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    marketplaceEnabled: process.env.MARKETPLACE_ENABLED === "true",
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

  // IA é opcional porque o Brasa Pro possui fallback determinístico/local.
  // Marketplace desligado também é esperado no lançamento inicial.
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
