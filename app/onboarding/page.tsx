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
    .select("full_name, account_type, phone, city, state, business_name, tax_id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const accountType =
    profile?.account_type === "professional" || profile?.account_type === "supplier"
      ? profile.account_type
      : "consumer";

  return (
    <main className="signup-page onboarding-premium-page">
      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-shell onboarding-premium-shell">
        <header className="signup-brand-row">
          <Link href="/" className="signup-brand">
            <span className="access-flame-mark">🔥</span>
            <span className="signup-brand-copy">
              <b>Brasa <i>Pro</i></b>
              <small>PRIMEIRO ACESSO</small>
            </span>
          </Link>
          <span className="onboarding-step">PASSO 1 DE 1</span>
        </header>

        <section className="signup-hero onboarding-premium-hero">
          <span className="signup-kicker">BEM-VINDO AO BRASA PRO</span>
          <h1>Prepare a plataforma para o seu <span>jeito</span></h1>
          <p>
            Escolha como vai usar o Brasa Pro e complete os dados básicos. Depois você vai direto para o melhor ponto de partida.
          </p>
        </section>

        <OnboardingForm
          initial={{
            full_name: profile?.full_name || user.user_metadata?.full_name || "",
            account_type: accountType,
            phone: profile?.phone || "",
            city: profile?.city || "",
            state: profile?.state || "",
            business_name: profile?.business_name || "",
            tax_id: profile?.tax_id || "",
          }}
        />
      </section>
    </main>
  );
}
