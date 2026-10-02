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
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-side">
          <Link href="/" className="brand">
            <span className="brand-flame">🔥</span>
            <span><b>Brasa <i>Pro</i></b><small>NOVA SENHA</small></span>
          </Link>

          <div>
            <span className="eyebrow">ACESSO SEGURO</span>
            <h1>Crie uma nova senha para sua conta.</h1>
            <p>Depois da alteração você volta diretamente para o Dashboard.</p>
          </div>
        </div>

        <div className="auth-card">
          <span className="eyebrow">NOVA SENHA</span>
          <h2>Atualizar credencial</h2>
          <p>Use pelo menos 8 caracteres.</p>
          <NewPasswordForm />
        </div>
      </section>
    </main>
  );
}
