import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ServicePackageItemForm from "@/components/ServicePackageItemForm";
import ServicePackageEditor from "@/components/ServicePackageEditor";
import ServicePackageItemEditor from "@/components/ServicePackageItemEditor";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Pacotes e cardápios profissionais");

  const [{ data: packageData }, { data: items }] = await Promise.all([
    supabase
      .from("service_packages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("service_package_items")
      .select("id, category, name, quantity, unit, notes, sort_order, created_at")
      .eq("package_id", id)
      .eq("user_id", user.id)
      .order("sort_order")
      .order("created_at"),
  ]);

  if (!packageData) notFound();

  const rows = items || [];
  const groups = new Map<string, typeof rows>();
  for (const item of rows) {
    const list = groups.get(item.category) || [];
    list.push(item);
    groups.set(item.category, list);
  }

  return (
    <main className="detail-page package-detail-page">
      <div className="shell detail-topbar">
        <Link href="/pacotes" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PACOTE PROFISSIONAL</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/pacotes" className="primary-button compact">← Pacotes</Link>
        </div>
      </div>

      <section className="shell detail-content">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">OFERTA COMERCIAL</span>
            <h1>{packageData.name}</h1>
            <p>{packageData.description || "Pacote profissional para eventos."}</p>
          </div>
          <div className="detail-actions">
            <span className="detail-status">{packageData.active ? "Ativo" : "Inativo"}</span>
            <ServicePackageEditor
              packageData={{
                id: packageData.id,
                name: packageData.name,
                description: packageData.description,
                price_per_person: packageData.price_per_person,
                min_guests: packageData.min_guests,
                active: packageData.active,
                notes: packageData.notes,
              }}
            />
            <RecordDeleteButton
              table="service_packages"
              id={packageData.id}
              confirmText="Excluir este pacote? Orçamentos antigos continuarão com a cópia do pacote já salva."
              redirectTo="/pacotes"
            />
          </div>
        </div>

        <div className="package-overview">
          <div>
            <small>PREÇO POR PESSOA</small>
            <strong>{money(Number(packageData.price_per_person || 0))}</strong>
          </div>
          <div>
            <small>MÍNIMO</small>
            <strong>{packageData.min_guests}</strong>
            <span>convidados</span>
          </div>
          <div>
            <small>ITENS INCLUÍDOS</small>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <small>EXEMPLO 50 PESSOAS</small>
            <strong>
              {money(Number(packageData.price_per_person || 0) * Math.max(50, packageData.min_guests))}
            </strong>
          </div>
        </div>

        <div className="package-detail-grid">
          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>CARDÁPIO E SERVIÇO</small><h2>O que está incluído</h2></div>
              <span className="list-count">{rows.length} itens</span>
            </div>

            {rows.length === 0 ? (
              <div className="compact-empty">
                <span>☷</span>
                <b>Pacote ainda vazio</b>
                <p>Adicione carnes, acompanhamentos, equipe, bebidas e estrutura.</p>
              </div>
            ) : (
              <div className="package-item-groups">
                {[...groups.entries()].map(([category, entries]) => (
                  <section className="package-item-group" key={category}>
                    <small>{category}</small>
                    <div>
                      {entries.map((item) => (
                        <div className="package-item-row" key={item.id}>
                          <b>{item.name}</b>
                          <span>
                            {item.quantity != null
                              ? Number(item.quantity).toLocaleString("pt-BR") + " " + item.unit
                              : item.unit !== "item"
                                ? item.unit
                                : "Incluído"}
                          </span>
                          {item.notes && <small>{item.notes}</small>}
                          <ServicePackageItemEditor item={item} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </article>

          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>ADICIONAR AO PACOTE</small><h2>Novo item</h2></div>
            </div>
            <ServicePackageItemForm packageId={packageData.id} />
          </article>
        </div>

        {packageData.notes && (
          <article className="detail-panel event-notes">
            <small>OBSERVAÇÕES INTERNAS</small>
            <p>{packageData.notes}</p>
          </article>
        )}
      </section>
    </main>
  );
}
