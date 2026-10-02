import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function FlameMark() {
  return (
    <svg viewBox="0 0 48 58" aria-hidden="true">
      <path
        d="M27.3 2.4c2.6 9.1-4.8 13-7.4 19.1-2.2 5.1-.6 9.5 3 13.2-7.4-1.8-11.4-7.8-9.9-14.4-7.5 6-11.8 13.7-10.6 21.6C3.9 52.1 12.4 58 23 58c12.4 0 22.3-8.9 22.5-21.3.2-12.7-9.2-23.2-18.2-34.3Z"
        fill="currentColor"
      />
      <path
        d="M27.5 28.3c1.4 5.1-3.6 7.9-4.5 11.5-.9 3.8 1 6.7 3.8 8.8-5.9.5-10.6-3.8-10.6-9.7 0-4.6 3-8.8 6.7-12.4.7 2.2 2.4 3.2 4.6 1.8Z"
        fill="#ffb13b"
      />
    </svg>
  );
}

function FeatureIcon({ kind }: { kind: "calc" | "cart" | "chart" }) {
  if (kind === "cart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2.1 10.2h9.7l2-7.2H7" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
      </svg>
    );
  }

  if (kind === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V11M12 19V5M19 19V8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  );
}

export default async function CadastroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="signup-page">
      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-shell">
        <header className="signup-brand-row">
          <Link href="/" className="signup-brand">
            <span className="signup-brand-mark"><FlameMark /></span>
            <span className="signup-brand-copy">
              <b>Brasa <i>Pro</i></b>
              <small>PLANEJE · CALCULE · VENDA · CRESÇA</small>
            </span>
          </Link>
        </header>

        <section className="signup-hero">
          <span className="signup-kicker">ENTRE PARA O BRASA PRO</span>
          <h1>
            Crie sua <span>conta</span>
          </h1>
          <p>
            Planeje seus churrascos, organize sua operação e transforme cada evento em resultado.
          </p>

          <div className="signup-feature-row">
            <div>
              <span className="signup-feature-icon"><FeatureIcon kind="calc" /></span>
              <b>Calculadora inteligente</b>
            </div>
            <div>
              <span className="signup-feature-icon"><FeatureIcon kind="cart" /></span>
              <b>Lista de compras</b>
            </div>
            <div>
              <span className="signup-feature-icon"><FeatureIcon kind="chart" /></span>
              <b>Ferramentas profissionais</b>
            </div>
          </div>
        </section>

        <section className="signup-card">
          <div className="signup-card-heading">
            <span className="eyebrow">CRIAR CONTA</span>
            <h2>Comece do seu jeito.</h2>
            <p>Escolha seu perfil e preencha seus dados. Você poderá alterar tudo depois.</p>
          </div>

          <AuthForm mode="signup" />

          <p className="signup-legal">
            Ao criar sua conta, você concorda com nossos{" "}
            <Link href="/termos">Termos de Uso</Link> e{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>

          <div className="signup-switch">
            <span>Já tem uma conta?</span>
            <Link href="/login">Entrar</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
