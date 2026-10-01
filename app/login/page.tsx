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
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-side">
          <Link href="/" className="brand">
            <span className="brand-flame">🔥</span>
            <span><b>Brasa <i>Pro</i></b><small>CHURRASCO COM MAIS RESULTADO</small></span>
          </Link>

          <div>
            <span className="eyebrow">BEM-VINDO DE VOLTA</span>
            <h1>Entre e continue seu próximo churrasco.</h1>
            <p>Planejamentos, clientes, eventos e resultados ficam salvos na sua conta.</p>
          </div>

          <div className="auth-benefits">
            <span>✓ Seus planejamentos salvos</span>
            <span>✓ Área profissional</span>
            <span>✓ Custos e lucro por evento</span>
          </div>
        </div>

        <div className="auth-card">
          <span className="eyebrow">ENTRAR</span>
          <h2>Acesse sua conta</h2>
          <p>Use o e-mail e a senha cadastrados no Brasa Pro.</p>
          <AuthForm mode="login" />
          <div className="auth-switch">
            Ainda não tem conta? <Link href="/cadastro">Criar conta grátis</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
