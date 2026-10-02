import Link from "next/link";
import { redirect } from "next/navigation";
import ServicePackageForm from "@/components/ServicePackageForm";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PackagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Pacotes e cardápios profissionais");

  const [{ data: packages }, { data: items }] = await Promise.all([
    supabase
      .from("service_packages")
      .select("id, name, description, price_per_person, min_guests, active, notes, created_at")
      .eq("user_id", user.id)
      .order("active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("service_package_items")
      .select("id, package_id")
      .eq("user_id", user.id),
  ]);

  const packageRows = packages || [];
  const itemCount = new Map<string, number>();
  for (const item of items || []) {
    itemCount.set(item.package_id, (itemCount.get(item.package_id) || 0) + 1);
  }

  return (
    <main className="workspace-page packages-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PACOTES</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">VENDA RÁPIDA</span>
            <h1>Pacotes e cardápios.</h1>
            <p>Monte ofertas prontas com preço por pessoa e use direto no orçamento do cliente.</p>
          </div>
          <span className="workspace-count">{packageRows.length} pacotes</span>
        </div>

        <div className="packages-main-grid">
          <article className="workspace-panel package-create-panel">
            <div className="panel-heading">
              <div><small>NOVO PACOTE</small><h2>Criar oferta</h2></div>
            </div>
            <ServicePackageForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SEU CARDÁPIO COMERCIAL</small><h2>Pacotes cadastrados</h2></div>
            </div>

            {packageRows.length === 0 ? (
              <div className="compact-empty">
                <span>🍖</span>
                <b>Nenhum pacote cadastrado</b>
                <p>Crie opções como Tradicional, Premium, Casamento ou Corporativo.</p>
              </div>
            ) : (
              <div className="package-card-list">
                {packageRows.map((item) => (
                  <Link href={"/pacotes/" + item.id} className="package-card" key={item.id}>
                    <div>
                      <small>{item.active ? "ATIVO" : "INATIVO"}</small>
                      <h3>{item.name}</h3>
                      <p>{item.description || "Pacote profissional"}</p>
                    </div>
                    <div className="package-card-meta">
                      <span>{itemCount.get(item.id) || 0} itens</span>
                      <span>Mín. {item.min_guests} pessoas</span>
                    </div>
                    <div className="package-card-price">
                      <small>POR PESSOA</small>
                      <strong>{money(Number(item.price_per_person || 0))}</strong>
                    </div>
                    <span className="event-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
