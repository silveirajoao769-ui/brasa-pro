import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="signup-page access-premium-page">
      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-shell access-premium-shell">
        <header className="signup-brand-row">
          <Link href="/" className="signup-brand">
            <span className="access-flame-mark">🔥</span>
            <span className="signup-brand-copy">
              <b>Brasa <i>Pro</i></b>
              <small>PLANEJE · CALCULE · VENDA · CRESÇA</small>
            </span>
          </Link>
        </header>

        <section className="signup-hero access-premium-hero">
          <span className="signup-kicker">BEM-VINDO DE VOLTA</span>
          <h1>Continue de onde <span>parou</span></h1>
          <p>
            Seus churrascos, clientes, eventos e resultados continuam salvos na sua conta.
          </p>
        </section>

        <section className="signup-card access-premium-card">
          <div className="signup-card-heading">
            <span className="eyebrow">ENTRAR</span>
            <h2>Acesse sua conta.</h2>
            <p>Use seu e-mail e senha cadastrados no Brasa Pro.</p>
          </div>

          <AuthForm mode="login" />

          <div className="access-card-links">
            <Link href="/esqueci-senha">Esqueci minha senha</Link>
          </div>

          <div className="signup-switch">
            <span>Ainda não tem uma conta?</span>
            <Link href="/cadastro">Criar conta grátis</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
