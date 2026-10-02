import Link from "next/link";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, account_type, phone, city, state, business_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const accountType =
    profile?.account_type === "professional" || profile?.account_type === "supplier"
      ? profile.account_type
      : "consumer";

  return (
    <main className="onboarding-page">
      <div className="shell onboarding-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PRIMEIRO ACESSO</small></span>
        </Link>
        <span className="onboarding-step">PASSO 1 DE 1</span>
      </div>

      <section className="shell onboarding-shell">
        <div className="onboarding-copy">
          <span className="eyebrow">BEM-VINDO AO BRASA PRO</span>
          <h1>Vamos preparar a plataforma para o seu jeito de usar.</h1>
          <p>
            Escolha seu perfil e complete os dados básicos. Depois o Brasa Pro leva você direto para o melhor ponto de partida.
          </p>
        </div>

        <OnboardingForm
          initial={{
            full_name: profile?.full_name || user.user_metadata?.full_name || "",
            account_type: accountType,
            phone: profile?.phone || "",
            city: profile?.city || "",
            state: profile?.state || "",
            business_name: profile?.business_name || "",
          }}
        />
      </section>
    </main>
  );
}
