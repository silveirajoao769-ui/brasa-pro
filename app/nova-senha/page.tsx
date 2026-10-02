import Link from "next/link";
import { redirect } from "next/navigation";
import NewPasswordForm from "@/components/NewPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/esqueci-senha");

  return (
    <main className="signup-page access-premium-page">
      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-shell access-premium-shell">
        <header className="signup-brand-row">
          <Link href="/" className="signup-brand">
            <span className="access-flame-mark">🔥</span>
            <span className="signup-brand-copy">
              <b>Brasa <i>Pro</i></b>
              <small>NOVA SENHA</small>
            </span>
          </Link>
        </header>

        <section className="signup-hero access-premium-hero compact">
          <span className="signup-kicker">ACESSO SEGURO</span>
          <h1>Crie sua nova <span>senha</span></h1>
          <p>Use pelo menos 8 caracteres e guarde sua nova credencial com segurança.</p>
        </section>

        <section className="signup-card access-premium-card access-compact-card">
          <div className="signup-card-heading">
            <span className="eyebrow">ATUALIZAR CREDENCIAL</span>
            <h2>Nova senha.</h2>
            <p>Depois da alteração você volta diretamente para o Dashboard.</p>
          </div>

          <NewPasswordForm />
        </section>
      </section>
    </main>
  );
}
