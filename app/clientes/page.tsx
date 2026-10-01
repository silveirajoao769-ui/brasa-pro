import Link from "next/link";
import { redirect } from "next/navigation";
import ClientForm from "@/components/ClientForm";
import ClientDeleteButton from "@/components/ClientDeleteButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CLIENTES</small></span>
        </Link>
        <Link href="/dashboard" className="ghost-button">← Dashboard</Link>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">ÁREA PROFISSIONAL</span>
            <h1>Clientes</h1>
            <p>Cadastre quem contrata seus eventos e mantenha o histórico organizado.</p>
          </div>
          <span className="workspace-count">{clients?.length || 0} cadastrados</span>
        </div>

        <div className="workspace-layout">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO CLIENTE</small><h2>Adicionar cliente</h2></div>
            </div>
            <ClientForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SUA BASE</small><h2>Clientes cadastrados</h2></div>
            </div>

            {!clients || clients.length === 0 ? (
              <div className="compact-empty">
                <span>👥</span>
                <b>Nenhum cliente cadastrado</b>
                <p>Adicione o primeiro cliente usando o formulário ao lado.</p>
              </div>
            ) : (
              <div className="records-list">
                {clients.map((client) => (
                  <div className="record-row" key={client.id}>
                    <div className="record-avatar">{client.name.slice(0, 2).toUpperCase()}</div>
                    <div className="record-main">
                      <b>{client.name}</b>
                      <span>{client.phone || client.email || "Sem contato informado"}</span>
                    </div>
                    <ClientDeleteButton id={client.id} />
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
