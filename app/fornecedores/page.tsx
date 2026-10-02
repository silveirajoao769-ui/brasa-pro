import Link from "next/link";
import { redirect } from "next/navigation";
import SupplierForm from "@/components/SupplierForm";
import SupplierProductForm from "@/components/SupplierProductForm";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Fornecedores e comparação de preços");

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, name, contact_name, phone, email, city, state, active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("supplier_products")
      .select("id, supplier_id, name, category, unit, price, brand, last_checked_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  const supplierMap = new Map((suppliers || []).map((supplier) => [supplier.id, supplier.name]));
  const productRows = products || [];
  const groups = new Map<string, typeof productRows>();

  for (const product of productRows) {
    const key = normalizeName(product.name);
    const current = groups.get(key) || [];
    current.push(product);
    groups.set(key, current);
  }

  const comparisons = [...groups.entries()]
    .map(([key, entries]) => {
      const sorted = [...entries].sort((a, b) => Number(a.price) - Number(b.price));
      return {
        key,
        name: sorted[0]?.name || key,
        entries: sorted,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>FORNECEDORES</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/estoque" className="ghost-button">Estoque</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">COMPRAR MELHOR, LUCRAR MAIS</span>
            <h1>Fornecedores e preços.</h1>
            <p>
              Cadastre fornecedores, registre os preços que você encontra e compare onde cada item está mais barato.
            </p>
          </div>
          <span className="workspace-count">{suppliers?.length || 0} fornecedores</span>
        </div>

        <div className="supplier-overview">
          <article>
            <small>FORNECEDORES</small>
            <strong>{suppliers?.length || 0}</strong>
            <span>Ativos na sua base</span>
          </article>
          <article>
            <small>PREÇOS CADASTRADOS</small>
            <strong>{productRows.length}</strong>
            <span>Produtos monitorados</span>
          </article>
          <article>
            <small>COMPARAÇÕES</small>
            <strong>{comparisons.length}</strong>
            <span>Itens agrupados por nome</span>
          </article>
        </div>

        <div className="supplier-form-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO FORNECEDOR</small><h2>Cadastrar fornecedor</h2></div>
            </div>
            <SupplierForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>TABELA DE PREÇOS</small><h2>Registrar produto</h2></div>
            </div>
            <SupplierProductForm suppliers={(suppliers || []).map((supplier) => ({ id: supplier.id, name: supplier.name }))} />
          </article>
        </div>

        <div className="supplier-content-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SUA REDE</small><h2>Fornecedores cadastrados</h2></div>
            </div>

            {!suppliers || suppliers.length === 0 ? (
              <div className="compact-empty">
                <span>🚚</span>
                <b>Nenhum fornecedor ainda</b>
                <p>Cadastre o primeiro fornecedor para começar a comparar preços.</p>
              </div>
            ) : (
              <div className="supplier-list">
                {suppliers.map((supplier) => (
                  <div className="supplier-card-row" key={supplier.id}>
                    <div className="record-avatar">🚚</div>
                    <div>
                      <b>{supplier.name}</b>
                      <span>
                        {[supplier.city, supplier.state].filter(Boolean).join(" / ") || "Local não informado"}
                      </span>
                      <small>{supplier.phone || supplier.email || "Sem contato informado"}</small>
                    </div>
                    <em>{productRows.filter((product) => product.supplier_id === supplier.id).length} preços</em>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>COMPARADOR</small><h2>Onde comprar mais barato</h2></div>
            </div>

            {comparisons.length === 0 ? (
              <div className="compact-empty">
                <span>🏷️</span>
                <b>Sem preços para comparar</b>
                <p>Registre o mesmo produto em fornecedores diferentes para ver o menor preço.</p>
              </div>
            ) : (
              <div className="price-comparison-list">
                {comparisons.map((comparison) => {
                  const cheapest = comparison.entries[0];
                  const highest = comparison.entries[comparison.entries.length - 1];
                  const saving = comparison.entries.length > 1
                    ? Number(highest.price) - Number(cheapest.price)
                    : 0;

                  return (
                    <div className="price-comparison-card" key={comparison.key}>
                      <div className="price-comparison-head">
                        <div>
                          <b>{comparison.name}</b>
                          <small>{comparison.entries.length} fornecedor(es)</small>
                        </div>
                        <strong>{money(Number(cheapest.price))}/{cheapest.unit}</strong>
                      </div>

                      <div className="price-comparison-details">
                        <span>Mais barato em <b>{supplierMap.get(cheapest.supplier_id) || "Fornecedor"}</b></span>
                        {saving > 0 && <em>Economia de até {money(saving)}/{cheapest.unit}</em>}
                      </div>

                      {comparison.entries.length > 1 && (
                        <div className="price-comparison-options">
                          {comparison.entries.slice(0, 4).map((entry) => (
                            <div key={entry.id}>
                              <span>{supplierMap.get(entry.supplier_id) || "Fornecedor"}</span>
                              <b>{money(Number(entry.price))}/{entry.unit}</b>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
