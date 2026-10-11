import Link from "next/link";

const resources = [
  { number:"01", icon:"↗", name:"Campanhas organizadas", description:"Produtos, links de afiliado, canais e investimentos acompanhados em um painel." },
  { number:"02", icon:"◎", name:"Execução orientada", description:"Tarefas, metas e desafios que transformam aulas em prática diária." },
  { number:"03", icon:"▣", name:"Financeiro sem achismos", description:"Registre despesas e comissões pendentes ou recebidas. Saiba o resultado real informado." },
  { number:"04", icon:"◇", name:"Gestão para mentores", description:"Crie turmas, envie atividades e visualize quem está executando o método." },
];

export default function Home() {
  return (
    <main className="aos-root aos-landing">
      <div className="aos-glow aos-glow-one" aria-hidden="true" />
      <div className="aos-glow aos-glow-two" aria-hidden="true" />
      <header className="aos-nav aos-container">
        <Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link>
        <nav className="aos-nav-links" aria-label="Navegação principal"><a href="#recursos">Recursos</a><a href="#mentores">Para mentores</a><a href="#planos">Planos</a></nav>
        <div className="aos-nav-actions"><Link href="/acesso" className="aos-btn aos-btn-ghost">Entrar</Link><Link href="/criar-conta" className="aos-btn aos-btn-primary">Começar grátis <span>↗</span></Link></div>
      </header>
      <section className="aos-container aos-hero">
        <div className="aos-hero-text">
          <div className="aos-pill"><span className="aos-status-dot" /> UM NOVO JEITO DE OPERAR SUAS VENDAS</div>
          <h1>Você aprende a vender.<br/><em>Agora, execute.</em></h1>
          <p>Organize sua operação de afiliado, acompanhe suas comissões e transforme cada estratégia em ação. O mesmo espaço conecta alunos e mentores.</p>
          <div className="aos-hero-actions"><Link href="/criar-conta" className="aos-btn aos-btn-primary aos-btn-lg">Criar minha conta <span>↗</span></Link><a href="#como-funciona" className="aos-btn aos-btn-outline aos-btn-lg">Entenda como funciona ↓</a></div>
          <div className="aos-hero-notes"><span>✓ Campanhas e resultados</span><span>✓ Turmas e atividades</span><span>✓ Sem promessas de ganho</span></div>
        </div>
        <div className="aos-mock" aria-label="Prévia ilustrativa do painel">
          <div className="aos-mock-head"><div className="aos-mock-lights"><i/><i/><i/></div><span>PRÉVIA DA PLATAFORMA</span><span>•••</span></div>
          <div className="aos-mock-body">
            <div className="aos-mock-aside"><span className="aos-mock-brand">A↗</span><span className="active">◫</span><span>◎</span><span>▣</span><span>☰</span></div>
            <div className="aos-mock-content"><div className="aos-mock-caption">VISÃO GERAL / AFILIADO</div><h2>Seu negócio, em foco.</h2><p>Dados de demonstração</p>
              <div className="aos-mock-stats"><div><small>Comissões</small><strong>R$ 2.480</strong><span>Registradas manualmente</span></div><div><small>Campanhas</small><strong>08</strong><span>Organizadas</span></div><div><small>Tarefas</small><strong>16/20</strong><span>Concluídas</span></div></div>
              <div className="aos-mock-chart"><div className="aos-chart-top"><strong>Evolução da operação</strong><small>Exemplo</small></div><div className="aos-bars">{[29,46,41,63,50,71,60,80,66,91,73,97].map((h,i)=><span key={i} style={{height:h+"%"}} />)}</div><div className="aos-axis"><span>SEM 1</span><span>SEM 2</span><span>SEM 3</span><span>SEM 4</span></div></div>
            </div>
          </div>
          <div className="aos-floating-note"><b>↗</b><span>Do aprendizado<br/>à execução real.</span></div>
        </div>
      </section>
      <section id="como-funciona" className="aos-container aos-proofline"><span>PARA QUEM QUER IR ALÉM DAS AULAS</span><span>PLANEJE <b>→</b> EXECUTE <b>→</b> ACOMPANHE</span></section>
      <section id="recursos" className="aos-container aos-section">
        <div className="aos-section-intro"><span className="aos-overline">UMA PLATAFORMA. O PROCESSO INTEIRO.</span><h2>Menos ferramentas soltas.<br/><em>Mais clareza para crescer.</em></h2><p>Comece com o essencial para aprender, operar e medir. Evoluímos com o feedback dos usuários.</p></div>
        <div className="aos-feature-grid">{resources.map(r=><article className="aos-feature" key={r.number}><div className="aos-feature-head"><span>{r.number} / MÓDULO</span><b>{r.icon}</b></div><h3>{r.name}</h3><p>{r.description}</p></article>)}</div>
      </section>
      <section id="mentores" className="aos-container aos-mentor-section"><div><span className="aos-overline">CONSTRUÍDO TAMBÉM PARA QUEM ENSINA</span><h2>Seu conteúdo ensina.<br/><em>Nosso sistema acompanha.</em></h2><p>Convide seus alunos para turmas, distribua tarefas e acompanhe sua evolução. Uma visão organizada da execução sem depender de planilhas e mensagens espalhadas.</p><Link href="/criar-conta" className="aos-btn aos-btn-primary">Criar espaço de mentor ↗</Link></div><div className="aos-mentor-illustration"><div className="aos-mentor-row"><span>●</span><strong>Turma de Afiliados</strong><small>PAINEL DO MENTOR</small></div><div className="aos-mini-member"><span>AM</span><div><b>Aluno 01</b><small>3 de 4 tarefas concluídas</small></div><i style={{width:"75%"}}/></div><div className="aos-mini-member"><span>JP</span><div><b>Aluno 02</b><small>2 de 4 tarefas concluídas</small></div><i style={{width:"50%"}}/></div><div className="aos-mini-member"><span>RL</span><div><b>Aluno 03</b><small>4 de 4 tarefas concluídas</small></div><i style={{width:"100%"}}/></div><p>Prévia ilustrativa · acompanhamento de tarefas</p></div></section>
      <section id="planos" className="aos-container aos-bottom"><span className="aos-overline">FASE PILOTO</span><h2>Comece a construir<br/><em>uma operação de verdade.</em></h2><p>Estamos preparando a primeira versão. Durante a fase piloto, os planos pagos ainda não estão disponíveis.</p><Link href="/criar-conta" className="aos-btn aos-btn-primary aos-btn-lg">Criar conta de teste ↗</Link></section>
      <footer className="aos-footer aos-container"><span>© 2026 Afiliado OS</span><span>Resultados dependem da sua operação. Não prometemos faturamento.</span></footer>
    </main>
  );
}
