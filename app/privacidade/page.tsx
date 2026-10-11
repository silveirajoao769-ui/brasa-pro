import Link from "next/link";

export const metadata={title:"Privacidade no piloto | Afiliado OS",robots:{index:false,follow:false}};
export default function Privacy(){
  return <main className="aos-root aos-auth-page"><article className="aos-auth-wrap" style={{width:"min(800px,100%)"}}>
    <Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link>
    <section className="aos-auth-panel" style={{marginTop:25}}>
      <span className="aos-overline">PRIVACIDADE · VERSÃO DE TESTES</span>
      <h1>Seus dados, <em>com contexto.</em></h1>
      <p>Informações preliminares sobre o piloto. Uma política formal, com identificação do responsável e canal de contato, é necessária antes do lançamento comercial.</p>
      <h2>O que o aplicativo processa</h2><p>Conta: e-mail, nome de exibição e dados técnicos de autenticação. Operação: produtos, links de afiliado, canais de divulgação, despesas e comissões informadas. Mentoria: pedidos de ingresso, turmas, tarefas e status de conclusão.</p>
      <h2>Visibilidade e acesso</h2><p>Cada afiliado deve ter acesso apenas às próprias campanhas e comissões. Mentores recebem informações de alunos ligados às suas turmas e podem acompanhar tarefas; não recebem acesso automático ao financeiro individual dos alunos.</p>
      <h2>Infraestrutura</h2><p>O software usa Next.js e serviços de infraestrutura como Vercel e Supabase no ambiente configurado. Ainda não há integração de cobrança da nova marca nem sincronização automática com marketplaces.</p>
      <h2>Orientação de teste</h2><p>Não insira informações sensíveis nem dados de terceiros. Até concluir a configuração do ambiente de homologação, a disponibilidade e os processos de exclusão de dados não estão validados.</p>
      <div className="aos-auth-footer"><Link href="/termos">Condições do piloto</Link> · <Link href="/">Página inicial</Link></div>
    </section></article></main>;
}
