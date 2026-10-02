import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="auth-page signup-reference-page">
      <div className="signup-fire-orb signup-fire-orb-one" />
      <div className="signup-fire-orb signup-fire-orb-two" />
      <div className="signup-ember e1" />
      <div className="signup-ember e2" />
      <div className="signup-ember e3" />

      <section className="signup-reference-shell">
        <header className="signup-reference-header">
          <Link href="/" className="signup-reference-brand">
            <span className="signup-reference-logo">🔥</span>
            <div>
              <b>Brasa<span>Pro</span></b>
              <small>PLANEJE · CALCULE · VENDA · CRESÇA</small>
            </div>
          </Link>
        </header>

        <div className="signup-reference-copy">
          <span className="signup-reference-line" />
          <span className="eyebrow">COMECE AGORA</span>
          <h1>Crie sua <span>conta</span></h1>
          <p>Entre para o Brasa Pro e leve seu churrasco para o próximo nível.</p>

          <div className="signup-reference-features">
            <article>
              <span>▣</span>
              <div><b>Calculadora</b><small>inteligente</small></div>
            </article>
            <article>
              <span>🛒</span>
              <div><b>Lista de</b><small>compras</small></div>
            </article>
            <article>
              <span>▥</span>
              <div><b>Ferramentas</b><small>para profissionais</small></div>
            </article>
          </div>
        </div>

        <section className="signup-reference-form-card">
          <AuthForm mode="signup" />
          <div className="auth-switch signup-reference-switch">
            Já tem uma conta? <Link href="/login">Entrar</Link>
          </div>
          <p className="signup-reference-legal">
            Ao criar sua conta, você concorda com nossos <Link href="/termos">Termos de Uso</Link> e <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
        </section>
      </section>
    </main>
  );
}
