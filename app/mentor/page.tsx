import Link from "next/link";
import { signOut } from "@/lib/affiliate/signout";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveJoin, createAssignment, createCohort } from "@/lib/affiliate/actions";

export const dynamic = "force-dynamic";
const notes:Record<string,string>={
  cohort_created:"Turma criada. Agora compartilhe o código.",
  approved:"Aluno aprovado e adicionado à turma.",
  task_created:"Atividade enviada ao aluno.",
  invalid_name:"Escolha um nome com no mínimo três letras.",
  invalid_task:"Confira os dados da atividade.",
  request_missing:"Não foi possível localizar a solicitação.",
  not_authorized:"Você não tem permissão para essa alteração.",
  save_error:"Falha ao salvar. Verifique a configuração do banco do Afiliado OS."
};

export default async function MentorPage({searchParams}:{searchParams:Promise<{status?:string}>}) {
  const {status}=await searchParams;
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) redirect("/acesso");

  const cohortsResult=await db.from("aos_cohorts").select("id,name,invite_code,created_at").eq("mentor_id",user.id).order("created_at",{ascending:false});
  const cohorts=cohortsResult.data||[];
  const ids=cohorts.map(c=>c.id), codes=cohorts.map(c=>c.invite_code);
  const [enrollmentsResult,requestsResult,tasksResult]=await Promise.all([
    ids.length?db.from("aos_enrollments").select("id,cohort_id,user_id").in("cohort_id",ids):Promise.resolve({data:[],error:null}),
    codes.length?db.from("aos_join_requests").select("id,user_id,invite_code").in("invite_code",codes):Promise.resolve({data:[],error:null}),
    ids.length?db.from("aos_tasks").select("id,title,cohort_id,student_id,completed_at").eq("mentor_id",user.id).order("created_at",{ascending:false}).limit(150):Promise.resolve({data:[],error:null})
  ]);
  const enrollments=enrollmentsResult.data||[], requests=requestsResult.data||[], tasks=tasksResult.data||[];
  const userIds=[...new Set(enrollments.map(e=>e.user_id))];
  const {data:profiles}=userIds.length?await db.from("aos_profiles").select("user_id,display_name").in("user_id",userIds):{data:[]};
  const names=new Map((profiles||[]).map(p=>[p.user_id,p.display_name]));
  const broken=[cohortsResult.error,enrollmentsResult.error,requestsResult.error,tasksResult.error].some(Boolean);

  return <main className="aos-root aos-workspace"><div className="aos-workspace-shell">
    <aside className="aos-work-nav"><Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><h3>MINHAS TURMAS</h3><Link href="/mentor" className="active">◫ Painel do mentor</Link><a href="#turmas">◇ Turmas</a><a href="#pedidos">☰ Pedidos de entrada</a><a href="#tarefas">◎ Acompanhamento</a><h3>OUTROS</h3><Link href="/afiliado">↗ Painel afiliado</Link><form action={signOut} className="aos-signout"><button type="submit">↪ Sair da conta</button></form></aside>
    <section className="aos-work-content">
      <div className="aos-work-top"><span>VISÃO GERAL / MENTOR</span><span className="aos-tag">● MVP EM TESTES</span></div>
      <div className="aos-work-title"><div><span className="aos-overline">CENTRAL DO MENTOR</span><h1>Da aula à execução.</h1><p>Organize turmas, aprove alunos e distribua atividades práticas.</p></div><Link href="/afiliado" className="aos-btn aos-btn-outline">Ver como afiliado ↗</Link></div>
      {status&&notes[status]&&<p role="status" className="aos-alert">{notes[status]}</p>}
      {broken&&<p role="alert" className="aos-alert">As tabelas do Afiliado OS ainda não estão disponíveis neste ambiente. Execute a migração SQL em um banco de teste.</p>}
      <div className="aos-kpis"><article className="aos-kpi"><small>Minhas turmas</small><strong>{cohorts.length}</strong><span>Turmas criadas</span></article><article className="aos-kpi"><small>Alunos</small><strong>{userIds.length}</strong><span>Participantes distintos</span></article><article className="aos-kpi"><small>Pedidos de entrada</small><strong>{requests.length}</strong><span>Aguardando avaliação</span></article><article className="aos-kpi"><small>Tarefas realizadas</small><strong>{tasks.filter(t=>t.completed_at).length}/{tasks.length}</strong><span>Concluídas pelos alunos</span></article></div>
      <div className="aos-dashboard-grid"><div>
        <section className="aos-card" id="turmas"><h2>◇ Minhas turmas</h2>{cohorts.length?cohorts.map(c=>{
          const members=enrollments.filter(e=>e.cohort_id===c.id);
          return <div key={c.id} className="aos-card" style={{background:"#0d1726",padding:17}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><b>{c.name}</b><span className="aos-tag">{members.length} alunos</span></div><p>Compartilhe o código com seus alunos:</p><code className="aos-code">{c.invite_code}</code>
            {members.length>0?<><p>Participantes: {members.map(e=>names.get(e.user_id)||"Aluno").join(", ")}</p><h2 style={{marginTop:22}}>＋ Distribuir atividade</h2><form action={createAssignment} className="aos-stack-form"><input type="hidden" name="cohort_id" value={c.id}/><label>Aluno<select name="student_id" required>{members.map(m=><option key={m.id} value={m.user_id}>{names.get(m.user_id)||"Aluno"}</option>)}</select></label><label>Atividade<input name="title" required minLength={3} maxLength={160} placeholder="Ex.: Criar primeira campanha"/></label><label>Instruções<textarea name="description" rows={3} maxLength={1500} placeholder="Detalhe a entrega esperada"/></label><label>Prazo<input type="date" name="due_at"/></label><button className="aos-btn aos-btn-primary">Enviar atividade ↗</button></form></>:<p>Sem alunos ainda. Compartilhe o convite acima.</p>}
          </div>;
        }):<div className="aos-empty">Nenhuma turma criada. Comece pelo formulário ao lado.</div>}</section>
        <section className="aos-card" id="tarefas"><h2>◎ Progresso de atividades</h2>{tasks.length?<table className="aos-table"><thead><tr><th>ALUNO</th><th>ATIVIDADE</th><th>STATUS</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{names.get(t.student_id)||"Aluno"}</td><td>{t.title}</td><td><span className={t.completed_at?"aos-tag":"aos-tag aos-tag-neutral"}>{t.completed_at?"Concluída":"Pendente"}</span></td></tr>)}</tbody></table>:<div className="aos-empty">Nenhuma atividade distribuída.</div>}</section>
      </div><div>
        <section className="aos-card"><h2>＋ Criar turma</h2><p>Cada turma tem um código de convite único.</p><form action={createCohort} className="aos-stack-form"><label>Nome da turma<input name="name" minLength={3} maxLength={100} required placeholder="Ex.: Mentoria Outubro"/></label><button className="aos-btn aos-btn-primary">Criar turma ↗</button></form></section>
        <section className="aos-card" id="pedidos"><h2>☰ Aguardando aprovação</h2><p>Os alunos que entrarem com o seu código aparecerão aqui.</p>{requests.length?requests.map(r=><div key={r.id} className="aos-task-item"><div><b>Solicitação de aluno</b><small>{cohorts.find(c=>c.invite_code===r.invite_code)?.name||"Turma"} · ID {r.user_id.slice(0,8)}…</small></div><form action={approveJoin}><input type="hidden" name="request_id" value={r.id}/><button>Aprovar ✓</button></form></div>):<div className="aos-empty">Sem pedidos por enquanto.</div>}</section>
        <section className="aos-card"><h2>Dados e privacidade</h2><p>O mentor acompanha atividades vinculadas à turma, não o saldo financeiro individual dos afiliados. Números de vendas só serão compartilhados no futuro mediante consentimento específico.</p></section>
      </div></div>
    </section>
  </div></main>;
}
