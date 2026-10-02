import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="signup-page access-premium-page">
      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-shell access-premium-shell">
        <header className="signup-brand-row">
          <Link href="/" className="signup-brand">
            <span className="access-flame-mark">🔥</span>
            <span className="signup-brand-copy">
              <b>Brasa <i>Pro</i></b>
              <small>ACESSO SEGURO</small>
            </span>
          </Link>
        </header>

        <section className="signup-hero access-premium-hero compact">
          <span className="signup-kicker">RECUPERAR ACESSO</span>
          <h1>Volte para sua <span>conta</span></h1>
          <p>Enviaremos um link seguro para o e-mail cadastrado.</p>
        </section>

        <section className="signup-card access-premium-card access-compact-card">
          <div className="signup-card-heading">
            <span className="eyebrow">ESQUECI MINHA SENHA</span>
            <h2>Recuperar senha.</h2>
            <p>Informe o e-mail usado no Brasa Pro.</p>
          </div>

          <ForgotPasswordForm />

          <div className="signup-switch">
            <span>Lembrou a senha?</span>
            <Link href="/login">Voltar para entrar</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
