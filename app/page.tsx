import Link from "next/link";
import QuickPlanner from "@/components/QuickPlanner";

const personas = [
  {
    icon: "🔥",
    title: "Vou fazer um churrasco",
    description: "Planejamento completo para o seu evento, sem desperdício.",
    tag: "Para todos",
  },
  {
    icon: "👨‍🍳",
    title: "Trabalho com churrasco",
    description: "Orçamentos, clientes, eventos, custos e lucro em um só lugar.",
    tag: "Profissional",
  },
  {
    icon: "🥩",
    title: "Sou açougue / fornecedor",
    description: "Marketplace para açougues e parceiros está em preparação.",
    tag: "Em breve",
  },
];

const features = [
  ["🧮", "Calculadora", "Quantidades certas para cada tipo de evento."],
  ["🛒", "Lista de compras", "Tudo separado por categorias e pronto para comprar."],
  ["📖", "Receitas", "Preparo, rendimento, custo e ficha técnica."],
  ["📄", "Orçamentos", "Monte propostas profissionais para seus clientes."],
  ["👥", "Clientes", "Histórico, preferências e eventos de cada cliente."],
  ["📦", "Estoque", "Controle insumos e evite compras desnecessárias."],
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="inicio">
        <div className="ember ember-one" />
        <div className="ember ember-two" />
        <nav className="nav shell">
          <a className="brand" href="#inicio" aria-label="Brasa Pro">
            <span className="brand-flame">🔥</span>
            <span>
              <b>Brasa <i>Pro</i></b>
              <small>CHURRASCO COM MAIS RESULTADO</small>
            </span>
          </a>

          <div className="nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#planejamento">Planejamento</a>
            <a href="#profissional">Profissional</a>
            <a href="#planos">Planos</a>
          </div>

          <div className="nav-actions">
            <Link className="ghost-button" href="/login">Entrar</Link>
            <Link className="primary-button compact" href="/cadastro">Comece agora</Link>
          </div>
        </nav>

        <div className="hero-grid shell">
          <div className="hero-copy">
            <span className="eyebrow">🔥 CHURRASCO + TECNOLOGIA</span>
            <h1>
              A plataforma<br />
              completa do <span>churrasco.</span>
            </h1>
            <p className="hero-subtitle">
              Planeje, compre, cozinhe e lucre. Do churrasco de domingo ao
              evento profissional.
            </p>

            <div className="persona-grid">
              {personas.map((persona, index) => (
                <article className={"persona-card " + (index === 0 ? "active" : "")} key={persona.title}>
                  <div className="persona-top">
                    <span className="persona-icon">{persona.icon}</span>
                    <small>{persona.tag}</small>
                  </div>
                  <h3>{persona.title}</h3>
                  <p>{persona.description}</p>
                  <Link href={index === 0 ? "/planejar" : index === 1 ? "/cadastro" : "/em-breve?feature=Marketplace"} aria-label={"Abrir " + persona.title}>→</Link>
                </article>
              ))}
            </div>

            <div className="hero-proof">
              <span>✓ Menos desperdício</span>
              <span>✓ Mais organização</span>
              <span>✓ Mais lucro</span>
            </div>
          </div>

          <div className="product-stage" aria-label="Prévia do dashboard Brasa Pro">
            <div className="glow-ring" />
            <div className="dashboard-window">
              <aside className="dashboard-sidebar">
                <div className="mini-brand">🔥 <b>Brasa <i>Pro</i></b></div>
                <div className="side-link active">⌂ <span>Dashboard</span></div>
                <div className="side-link">✦ <span>Planejamento</span></div>
                <div className="side-link">▦ <span>Calculadora</span></div>
                <div className="side-link">☷ <span>Receitas</span></div>
                <div className="side-link">🛒 <span>Compras</span></div>
                <div className="side-link">□ <span>Estoque</span></div>
                <div className="side-link">♙ <span>Clientes</span></div>
                <div className="side-link">↗ <span>Financeiro</span></div>
              </aside>

              <div className="dashboard-main">
                <div className="dash-heading">
                  <div>
                    <small>VISÃO GERAL</small>
                    <h2>Boa tarde! 🔥</h2>
                  </div>
                  <div className="avatar">BP</div>
                </div>

                <div className="metric-row">
                  <div><small>PESSOAS</small><strong>25</strong></div>
                  <div><small>ORÇAMENTO</small><strong>R$ 900</strong></div>
                  <div><small>CUSTO EST.</small><strong>R$ 864</strong></div>
                  <div className="green"><small>LUCRO EVENTO</small><strong>R$ 4.100</strong></div>
                </div>

                <div className="ai-panel">
                  <div>
                    <span className="eyebrow">✦ PLANEJAMENTO INTELIGENTE</span>
                    <h3>Churrasco para 25 pessoas</h3>
                    <p>Costela, picanha, linguiça e acompanhamentos.</p>
                  </div>
                  <Link href="/planejar">Gerar plano →</Link>
                </div>

                <div className="mini-feature-row">
                  <div><span>🧮</span><b>Calculadora</b><small>Quantidade certa</small></div>
                  <div><span>🛒</span><b>Compras</b><small>Lista inteligente</small></div>
                  <div><span>📖</span><b>Receitas</b><small>Passo a passo</small></div>
                  <div><span>📄</span><b>Orçamento</b><small>Evento profissional</small></div>
                </div>

                <div className="dash-bottom">
                  <div className="recipe-card">
                    <div className="fake-food">
                      <span>🔥</span>
                    </div>
                    <div>
                      <small>RECEITA EM DESTAQUE</small>
                      <h4>Costela fogo de chão</h4>
                      <p>8h · Média · 25 pessoas</p>
                    </div>
                  </div>

                  <div className="profit-card">
                    <div className="donut"><span>82%</span></div>
                    <div>
                      <small>FINANCEIRO</small>
                      <h4>Margem do evento</h4>
                      <p><b>R$ 4.100</b> de lucro estimado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="phone-preview">
              <div className="phone-notch" />
              <div className="phone-brand">🔥 Brasa <span>Pro</span></div>
              <h3>Planeje seu<br />churrasco</h3>
              <p>Em poucos cliques, tudo pronto.</p>
              <div className="phone-field"><small>QUANTAS PESSOAS?</small><b>25 pessoas</b></div>
              <div className="phone-field"><small>QUAL O ESTILO?</small><b>Churrasco raiz</b></div>
              <button>Gerar planejamento</button>
              <div className="phone-check">✓ Lista de cortes e quantidades</div>
              <div className="phone-check">✓ Lista de compras</div>
              <div className="phone-check">✓ Custo estimado</div>
            </div>
          </div>
        </div>

        <div className="hero-bottom shell">
          <div><b>01</b><span>Planeje</span></div>
          <div><b>02</b><span>Compre</span></div>
          <div><b>03</b><span>Cozinhe</span></div>
          <div><b>04</b><span>Lucre</span></div>
        </div>
      </section>

      <section className="section shell" id="recursos">
        <div className="section-heading">
          <span className="eyebrow">TUDO EM UM SÓ LUGAR</span>
          <h2>Do primeiro cálculo ao último centavo.</h2>
          <p>
            O Brasa Pro foi pensado para eliminar improviso e transformar o churrasco
            em uma experiência organizada e previsível.
          </p>
        </div>

        <div className="features-grid">
          {features.map(([icon, title, description]) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <a href="#planejamento">Explorar →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section planner-section" id="planejamento">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">PLANEJAMENTO DO CHURRASCO</span>
              <h2>Descubra quanto comprar antes de acender a brasa.</h2>
            </div>
            <p>
              Informe convidados, duração e preferências para receber quantidades,
              estimativa de custo e uma lista de compras pronta para usar.
            </p>
          </div>
          <QuickPlanner />
        </div>
      </section>

      <section className="section shell" id="profissional">
        <div className="pro-grid">
          <div className="pro-copy">
            <span className="eyebrow">BRASA PRO PROFISSIONAL</span>
            <h2>Seu churrasco é negócio? Então trate como negócio.</h2>
            <p>
              Organize clientes, eventos, custos e margens sem depender de planilhas
              espalhadas e contas feitas de cabeça.
            </p>
            <div className="pro-list">
              <div><span>01</span><b>Crie o evento</b><p>Cliente, data, convidados e cardápio.</p></div>
              <div><span>02</span><b>Calcule o custo</b><p>Ingredientes, equipe, transporte e extras.</p></div>
              <div><span>03</span><b>Defina sua margem</b><p>Veja quanto cobrar e quanto realmente sobra.</p></div>
            </div>
          </div>

          <div className="finance-demo">
            <div className="finance-head">
              <div><small>EVENTO</small><h3>Casamento · 120 pessoas</h3></div>
              <span>Planejado</span>
            </div>
            <div className="finance-big">
              <small>LUCRO ESTIMADO</small>
              <strong>R$ 4.100</strong>
              <span>42,7% de margem</span>
            </div>
            <div className="finance-lines">
              <div><span>Receita</span><b>R$ 9.600</b></div>
              <div><span>Carnes e ingredientes</span><b>R$ 3.250</b></div>
              <div><span>Equipe</span><b>R$ 1.200</b></div>
              <div><span>Transporte + extras</span><b>R$ 1.050</b></div>
            </div>
            <div className="finance-footer">
              <div><small>CUSTO / PESSOA</small><b>R$ 45,83</b></div>
              <div><small>PREÇO / PESSOA</small><b>R$ 80,00</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pricing-section" id="planos">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">PLANOS SIMPLES</span>
            <h2>Comece grátis. Profissionalize quando precisar.</h2>
          </div>

          <div className="pricing-grid">
            <article className="price-card">
              <small>GRÁTIS</small>
              <h3>R$ 0</h3>
              <p>Para quem quer organizar o próximo churrasco.</p>
              <ul>
                <li>✓ Calculadora básica</li>
                <li>✓ Planejamento simples</li>
                <li>✓ Algumas receitas</li>
                <li>✓ Lista de compras</li>
              </ul>
              <Link href="/planejar" className="ghost-button wide">Começar grátis</Link>
            </article>

            <article className="price-card featured">
              <span className="popular">MAIS COMPLETO</span>
              <small>BRASA PRO</small>
              <h3>R$ 39,90 <em>/ mês</em></h3>
              <p>Para quem quer mais controle ou trabalha com churrasco.</p>
              <ul>
                <li>✓ Planejamento avançado</li>
                <li>✓ Eventos e clientes</li>
                <li>✓ Orçamentos profissionais</li>
                <li>✓ Custos, margem e lucro</li>
                <li>✓ Recursos profissionais</li>
              </ul>
              <Link href="/plano" className="primary-button wide">Quero ser Pro →</Link>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <div className="brand footer-brand">
            <span className="brand-flame">🔥</span>
            <span><b>Brasa <i>Pro</i></b><small>PLANEJE · COMPRE · COZINHE · LUCRE</small></span>
          </div>
          <div className="footer-meta">
            <p>Brasa Pro · Planejamento e gestão profissional de churrascos.</p>
            <div className="footer-legal-links">
              <Link href="/termos">Termos de Uso</Link>
              <Link href="/privacidade">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
