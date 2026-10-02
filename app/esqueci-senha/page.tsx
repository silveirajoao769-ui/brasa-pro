import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-side">
          <Link href="/" className="brand">
            <span className="brand-flame">🔥</span>
            <span><b>Brasa <i>Pro</i></b><small>RECUPERAÇÃO DE ACESSO</small></span>
          </Link>

          <div>
            <span className="eyebrow">RECUPERAR SENHA</span>
            <h1>Volte para sua operação sem perder seus dados.</h1>
            <p>Enviaremos um link seguro para o e-mail cadastrado na sua conta.</p>
          </div>
        </div>

        <div className="auth-card">
          <span className="eyebrow">ESQUECI MINHA SENHA</span>
          <h2>Recuperar acesso</h2>
          <p>Informe o e-mail usado no Brasa Pro.</p>
          <ForgotPasswordForm />
          <div className="auth-switch">
            Lembrou a senha? <Link href="/login">Voltar para entrar</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
