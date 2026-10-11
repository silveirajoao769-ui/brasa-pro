import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only application-owned destinations may be selected from an e-mail link.
const destinations = new Set(["/afiliado", "/mentor", "/nova-senha"]);
function safeNext(value: string | null) {
  return value && destinations.has(value) ? value : "/afiliado";
}

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedDestination = safeNext(searchParams.get("next"));

  if (code) {
    const db = await createClient();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;
      const metadata = user.user_metadata ?? {};
      const preferred = metadata.aos_preference === "mentor" ? "mentor" : "affiliate";
      const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
      const displayName = (fullName || user.email?.split("@")[0] || "Usuário").slice(0, 100);
      // Insert once; later preference changes are stored in the database, not in mutable JWT user metadata.
      const { data: existing } = await db.from("aos_profiles").select("preference").eq("user_id", user.id).maybeSingle();
      if (!existing) {
        await db.from("aos_profiles").insert({
          user_id: user.id, display_name: displayName, preference: preferred,
        });
      }
      // Password recovery must always continue to the reset screen.
      const destination = requestedDestination === "/nova-senha"
        ? "/nova-senha"
        : existing?.preference === "mentor" || preferred === "mentor" || requestedDestination === "/mentor"
          ? "/mentor"
          : "/afiliado";
      return NextResponse.redirect(new URL(destination, origin));
    }
  }
  return NextResponse.redirect(new URL("/acesso?error=auth_callback", origin));
}
