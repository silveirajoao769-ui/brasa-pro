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
    <main className="signup-showcase-page">
      <div className="signup-showcase-photo" aria-hidden="true" />
      <div className="signup-showcase-shade" aria-hidden="true" />

      <header className="signup-showcase-topbar">
        <Link href="/" className="signup-showcase-brand">
          <span className="signup-showcase-brandmark"><FlameMark /></span>
          <strong>BRASA <i>PRO</i></strong>
        </Link>

        <nav className="signup-showcase-nav" aria-label="Navegação">
          <Link href="/#recursos">Recursos</Link>
          <Link href="/plano">Planos</Link>
          <Link href="/#sobre">Quem somos</Link>
          <Link href="/suporte">Ajuda</Link>
          <Link href="/login" className="signup-showcase-login">Entrar</Link>
        </nav>
      </header>

      <section className="signup-showcase-grid">
        <div className="signup-showcase-left">
          <div className="signup-showcase-copy">
            <span className="signup-showcase-kicker">
              GESTÃO INTELIGENTE PARA QUEM LEVA CHURRASCO A SÉRIO
            </span>

            <h1>
              Crie sua <span>conta</span>
            </h1>

            <p>
              Entre para o Brasa Pro e leve seu churrasco — ou seu negócio — para o próximo nível.
            </p>

            <div className="signup-showcase-features">
              <article>
                <span className="signup-showcase-featureicon"><FeatureIcon kind="calc" /></span>
                <h2>Calculadora inteligente</h2>
                <p>Descubra quantidades ideais de carnes, bebidas e acompanhamentos.</p>
              </article>

              <article>
                <span className="signup-showcase-featureicon"><FeatureIcon kind="cart" /></span>
                <h2>Lista de compras</h2>
                <p>Organize tudo que precisa comprar e tenha o custo estimado em um só lugar.</p>
              </article>

              <article>
                <span className="signup-showcase-featureicon"><FeatureIcon kind="chart" /></span>
                <h2>Ferramentas profissionais</h2>
                <p>Controle clientes, eventos, propostas, equipe, financeiro e resultados.</p>
              </article>
            </div>
          </div>

          <div className="signup-showcase-signature">
            <span>Mais churrasco.</span>
            <b>Menos complicação.</b>
          </div>
        </div>

        <div className="signup-showcase-right">
          <section className="signup-showcase-card">
            <div className="signup-showcase-cardhead">
              <span className="signup-showcase-mini-brand">
                <span className="signup-showcase-mini-flame"><FlameMark /></span>
                <b>Brasa <i>Pro</i></b>
              </span>
              <h2>Crie sua conta gratuitamente e comece agora.</h2>
            </div>

            <AuthForm mode="signup" />

            <p className="signup-showcase-legal">
              Ao criar sua conta, você concorda com nossos{" "}
              <Link href="/termos">Termos de Uso</Link> e nossa{" "}
              <Link href="/privacidade">Política de Privacidade</Link>.
            </p>

            <div className="signup-showcase-switch">
              <span>Já tem uma conta?</span>
              <Link href="/login">Entrar</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
