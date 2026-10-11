import Link from "next/link";
import { signOut } from "@/lib/affiliate/signout";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCampaign, recordCommission, requestJoin, toggleTask, markCommissionPaid } from "@/lib/affiliate/actions";

export const dynamic = "force-dynamic";
const brl = (cents: number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const notices:Record<string,string> = {
  campaign_created:"Campanha registrada.",commission_created:"Comissão registrada.",commission_paid:"Comissão marcada como recebida.",
  request_received:"Pedido enviado. Aguarde a aprovação do mentor.",
  task_updated:"Atividade atualizada.",invalid_campaign:"Confira os dados da campanha.",
  invalid_commission:"Informe uma comissão válida.",invalid_code:"Código de convite inválido.",
  save_error:"Não foi possível salvar. Confira a configuração do banco.",invalid_task:"Tarefa inválida."
};

export default async function AffiliatePage({searchParams}:{searchParams:Promise<{status?:string}>}) {
  const {status}=await searchParams;
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) redirect("/acesso");

  const name=(typeof user.user_metadata?.full_name==="string" && user.user_metadata.full_name.trim()) || user.email?.split("@")[0] || "Afiliado";
  const profile=await db.from("aos_profiles").upsert({user_id:user.id,display_name:name.slice(0,100),preference:"affiliate"}, {onConflict:"user_id",ignoreDuplicates:true});
  const [campaignsQuery,commissionsQuery,tasksQuery,membershipsQuery,pendingQuery,totalsQuery]=await Promise.all([
    db.from("aos_campaigns").select("id,product_name,platform,channel,affiliate_url,spent_cents").eq("user_id",user.id).order("created_at",{ascending:false}).limit(60),
    db.from("aos_commissions").select("id,campaign_id,amount_cents,status").eq("user_id",user.id).order("created_at",{ascending:false}).limit(150),
    db.from("aos_tasks").select("id,title,description,due_at,completed_at").eq("student_id",user.id).order("created_at",{ascending:false}).limit(100),
    db.from("aos_enrollments").select("id").eq("user_id",user.id),
    db.from("aos_join_requests").select("id").eq("user_id",user.id),
    db.rpc("aos_my_financial_summary").single()
  ]);
  const campaigns=campaignsQuery.data||[], commissions=commissionsQuery.data||[], tasks=tasksQuery.data||[];
  const totals=totalsQuery.data as null | {
    spent_cents: number | string | null;
    received_cents: number | string | null;
    pending_cents: number | string | null;
  };
  const spent=totals?.spent_cents == null ? null : Number(totals.spent_cents);
  const paid=totals?.received_cents == null ? null : Number(totals.received_cents);
  const pending=totals?.pending_cents == null ? null : Number(totals.pending_cents);
  const pendingCommissions=commissions.filter(c=>c.status==="pending");
  const errors=[profile.error,campaignsQuery.error,commissionsQuery.error,tasksQuery.error,membershipsQuery.error,pendingQuery.error,totalsQuery.error].some(Boolean);
  return <main className="aos-root aos-workspace"><div className="aos-workspace-shell">
    <aside className="aos-work-nav"><Link className="aos-logo" href="/"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><h3>MINHA OPERAÇÃO</h3><Link href="/afiliado" className="active">◫ Visão geral</Link><a href="#campanhas">↗ Campanhas</a><a href="#comissoes">▣ Comissões</a><a href="#atividades">◎ Atividades</a><a href="#turmas">◇ Minhas turmas</a><h3>OUTROS</h3><Link href="/mentor">♧ Painel mentor</Link><form action={signOut} className="aos-signout"><button type="submit">↪ Sair da conta</button></form></aside>
    <section className="aos-work-content">
      <div className="aos-work-top"><span>VISÃO GERAL / AFILIADO</span><span className="aos-tag">● MVP EM TESTES</span></div>
      <div className="aos-work-title"><div><span className="aos-overline">SUA OPERAÇÃO</span><h1>Olá, {name.split(" ")[0]} 👋</h1><p>Organize suas ações e acompanhe números que você informou.</p></div><Link href="/mentor" className="aos-btn aos-btn-outline">Sou mentor ↗</Link></div>
      {status&&notices[status]&&<p role="status" className="aos-alert">{notices[status]}</p>}
      {errors&&<p role="alert" className="aos-alert">Banco do Afiliado OS ainda não configurado. Execute a migração SQL no ambiente de teste para salvar dados reais.</p>}
      <div className="aos-kpis">
        <article className="aos-kpi"><small>Comissões recebidas</small><strong>{paid === null ? "—" : brl(paid)}</strong><span>Registradas por você</span></article>
        <article className="aos-kpi"><small>Comissões pendentes</small><strong>{pending === null ? "—" : brl(pending)}</strong><span>Aguardando recebimento</span></article>
        <article className="aos-kpi"><small>Despesas das campanhas</small><strong>{spent === null ? "—" : brl(spent)}</strong><span>Investimento registrado</span></article>
        <article className="aos-kpi"><small>Saldo registrado</small><strong>{paid === null || spent === null ? "—" : brl(paid-spent)}</strong><span>Recebido menos despesas</span></article>
      </div>
      <div className="aos-dashboard-grid"><div>
        <section className="aos-card" id="campanhas"><h2>↗ Campanhas e links</h2><p>Exibindo as 60 campanhas mais recentes. O resumo financeiro considera todo o histórico.</p>{campaigns.length?
          <table className="aos-table"><thead><tr><th>PRODUTO</th><th>CANAL</th><th>DESPESA</th><th>LINK</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id}><td><b>{c.product_name}</b><small>{c.platform}</small></td><td>{c.channel}</td><td>{brl(Number(c.spent_cents))}</td><td><a href={c.affiliate_url} target="_blank" rel="noopener noreferrer">Abrir ↗</a></td></tr>)}</tbody></table>
          :<div className="aos-empty">Nenhuma campanha cadastrada. Adicione o primeiro produto.</div>}</section>
        <section className="aos-card"><h2>⌁ Comissões aguardando pagamento</h2>
          {pendingCommissions.length ? pendingCommissions.slice(0,15).map(c=><div className="aos-task-item" key={c.id}>
            <div><b>{brl(Number(c.amount_cents))}</b><small>{campaigns.find(p=>p.id===c.campaign_id)?.product_name || "Campanha antiga"}</small></div>
            <form action={markCommissionPaid}><input type="hidden" name="commission_id" value={c.id}/><button type="submit">Recebida ✓</button></form>
          </div>) : <div className="aos-empty">Nenhuma comissão pendente entre os últimos registros.</div>}
          <p className="aos-helper">Informe o recebimento apenas após confirmar o pagamento na plataforma de afiliados.</p>
        </section>
        <section className="aos-card" id="atividades"><h2>◎ Atividades do mentor <span className="aos-tag aos-tag-neutral">{tasks.filter(t=>t.completed_at).length}/{tasks.length}</span></h2>{tasks.length?tasks.map(t=>
          <div className="aos-task-item" key={t.id}><div><b className={t.completed_at?"completed":""}>{t.title}</b><small>{t.description}{t.due_at?" · Prazo: "+new Date(t.due_at+"T12:00:00").toLocaleDateString("pt-BR"):""}</small></div><form action={toggleTask}><input type="hidden" name="task_id" value={t.id}/><input type="hidden" name="completed" value={String(!t.completed_at)}/><button>{t.completed_at?"Reabrir":"Concluir ✓"}</button></form></div>
        ):<div className="aos-empty">Entre em uma turma para receber atividades.</div>}</section>
        <section className="aos-card" id="turmas"><h2>◇ Entrar em uma turma</h2><p>Peça ao seu mentor o código de convite e solicite a participação.</p><div className="aos-kpis" style={{gridTemplateColumns:"1fr 1fr"}}><article className="aos-kpi"><small>Turmas ativas</small><strong>{membershipsQuery.data?.length||0}</strong></article><article className="aos-kpi"><small>Pedidos enviados</small><strong>{pendingQuery.data?.length||0}</strong></article></div><form action={requestJoin} className="aos-stack-form"><label>Código de convite<input name="invite_code" required maxLength={36} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></label><button className="aos-btn aos-btn-primary">Solicitar entrada →</button></form></section>
      </div><div>
        <section className="aos-card"><h2>＋ Nova campanha</h2><form className="aos-stack-form" action={createCampaign}><label>Produto divulgado<input name="product_name" maxLength={120} required placeholder="Ex.: Curso de marketing digital"/></label><label>Plataforma<input name="platform" maxLength={70} required placeholder="Ex.: Hotmart, Shopee"/></label><label>Canal de divulgação<input name="channel" maxLength={70} required placeholder="Ex.: Instagram"/></label><label>Seu link de afiliado<input name="affiliate_url" type="url" maxLength={2048} required placeholder="https://..."/></label><label>Despesa com a campanha (R$)<input name="spend" type="number" min="0" step="0.01" defaultValue="0" required/></label><button className="aos-btn aos-btn-primary">Salvar campanha ↗</button></form></section>
        <section className="aos-card" id="comissoes"><h2>▣ Registrar comissão</h2>{campaigns.length?<form className="aos-stack-form" action={recordCommission}><label>Campanha<select name="campaign_id" required>{campaigns.map(c=><option value={c.id} key={c.id}>{c.product_name}</option>)}</select></label><label>Valor da comissão (R$)<input name="amount" type="number" min="0.01" step="0.01" required/></label><label>Situação<select name="status"><option value="pending">Pendente</option><option value="paid">Recebida</option></select></label><button className="aos-btn aos-btn-primary">Registrar comissão ↗</button></form>:<div className="aos-empty">Cadastre uma campanha primeiro.</div>}<p className="aos-helper" style={{marginTop:14}}>Valores informados manualmente. Não há integração automática com marketplaces nesta versão.</p></section>
        <section className="aos-card"><h2>Sobre seus números</h2><p>Saldo registrado = comissões recebidas menos despesas cadastradas. Não considera impostos, taxas, estornos nem outros custos não lançados.</p></section>
      </div></div>
    </section></div></main>;
}
