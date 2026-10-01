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
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-side">
          <Link href="/" className="brand">
            <span className="brand-flame">🔥</span>
            <span><b>Brasa <i>Pro</i></b><small>PLANEJE · COMPRE · COZINHE · LUCRE</small></span>
          </Link>

          <div>
            <span className="eyebrow">COMECE GRÁTIS</span>
            <h1>Seu churrasco começa antes da primeira brasa.</h1>
            <p>Crie sua conta e transforme planejamento em quantidade certa, menos desperdício e mais resultado.</p>
          </div>

          <div className="auth-benefits">
            <span>✓ Calculadora inteligente</span>
            <span>✓ Lista de compras</span>
            <span>✓ Ferramentas para profissionais</span>
          </div>
        </div>

        <div className="auth-card">
          <span className="eyebrow">CRIAR CONTA</span>
          <h2>Entre para o Brasa Pro</h2>
          <p>Escolha seu perfil. Você poderá mudar suas informações depois.</p>
          <AuthForm mode="signup" />
          <div className="auth-switch">
            Já tem uma conta? <Link href="/login">Entrar</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
