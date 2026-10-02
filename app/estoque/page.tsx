import Link from "next/link";
import { redirect } from "next/navigation";
import InventoryItemForm from "@/components/InventoryItemForm";
import InventoryMovementForm from "@/components/InventoryMovementForm";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Controle de estoque");

  const [{ data: items }, { data: suppliers }, { data: movements }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, category, unit, quantity, min_quantity, average_unit_cost, preferred_supplier_id, updated_at")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("inventory_movements")
      .select("id, inventory_item_id, movement_type, quantity, unit_cost, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const supplierMap = new Map((suppliers || []).map((supplier) => [supplier.id, supplier.name]));
  const itemMap = new Map((items || []).map((item) => [item.id, item.name]));

  const lowStock = (items || []).filter(
    (item) => Number(item.quantity) <= Number(item.min_quantity) && Number(item.min_quantity) > 0,
  );
  const totalValue = (items || []).reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.average_unit_cost),
    0,
  );
  const totalUnits = (items || []).reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>ESTOQUE</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/fornecedores" className="ghost-button">Fornecedores</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">CONTROLE OPERACIONAL</span>
            <h1>Estoque sem surpresa.</h1>
            <p>
              Saiba o que você tem, o que está acabando e quanto dinheiro está parado em insumos.
            </p>
          </div>
          <span className="workspace-count">{items?.length || 0} itens</span>
        </div>

        <div className="supplier-overview">
          <article>
            <small>ITENS EM ESTOQUE</small>
            <strong>{items?.length || 0}</strong>
            <span>Produtos controlados</span>
          </article>
          <article>
            <small>QUANTIDADE TOTAL</small>
            <strong>{totalUnits.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong>
            <span>Somatório das unidades</span>
          </article>
          <article className={lowStock.length > 0 ? "stock-alert-card" : ""}>
            <small>ESTOQUE BAIXO</small>
            <strong>{lowStock.length}</strong>
            <span>Itens pedindo reposição</span>
          </article>
          <article>
            <small>VALOR EM ESTOQUE</small>
            <strong>{money(totalValue)}</strong>
            <span>Custo aproximado</span>
          </article>
        </div>

        {lowStock.length > 0 && (
          <div className="stock-alert-strip">
            <span>⚠️</span>
            <div>
              <b>Reposição necessária</b>
              <p>{lowStock.map((item) => item.name).slice(0, 5).join(", ")}</p>
            </div>
            <Link href="/fornecedores" className="ghost-button">Comparar fornecedores</Link>
          </div>
        )}

        <div className="supplier-form-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO ITEM</small><h2>Adicionar ao estoque</h2></div>
            </div>
            <InventoryItemForm suppliers={suppliers || []} />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>ENTRADA / SAÍDA</small><h2>Movimentar estoque</h2></div>
            </div>
            <InventoryMovementForm
              items={(items || []).map((item) => ({
                id: item.id,
                name: item.name,
                quantity: Number(item.quantity),
                unit: item.unit,
              }))}
            />
          </article>
        </div>

        <div className="supplier-content-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>POSIÇÃO ATUAL</small><h2>Itens do estoque</h2></div>
            </div>

            {!items || items.length === 0 ? (
              <div className="compact-empty">
                <span>📦</span>
                <b>Estoque vazio</b>
                <p>Adicione os primeiros insumos para começar o controle.</p>
              </div>
            ) : (
              <div className="inventory-list">
                {items.map((item) => {
                  const isLow = Number(item.min_quantity) > 0 && Number(item.quantity) <= Number(item.min_quantity);
                  const value = Number(item.quantity) * Number(item.average_unit_cost);

                  return (
                    <div className={isLow ? "inventory-row low" : "inventory-row"} key={item.id}>
                      <div className="inventory-icon">{isLow ? "⚠️" : "📦"}</div>
                      <div className="inventory-main">
                        <b>{item.name}</b>
                        <span>
                          {item.category}
                          {item.preferred_supplier_id
                            ? " · " + (supplierMap.get(item.preferred_supplier_id) || "Fornecedor")
                            : ""}
                        </span>
                      </div>
                      <div className="inventory-qty">
                        <strong>{Number(item.quantity).toLocaleString("pt-BR")} {item.unit}</strong>
                        <small>Mín. {Number(item.min_quantity).toLocaleString("pt-BR")} {item.unit}</small>
                      </div>
                      <div className="inventory-value">
                        <strong>{money(value)}</strong>
                        <small>{money(Number(item.average_unit_cost))}/{item.unit}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>HISTÓRICO</small><h2>Últimas movimentações</h2></div>
            </div>

            {!movements || movements.length === 0 ? (
              <div className="compact-empty">
                <span>↕️</span>
                <b>Sem movimentações</b>
                <p>Entradas e saídas do estoque aparecerão aqui.</p>
              </div>
            ) : (
              <div className="movement-list">
                {movements.map((movement) => (
                  <div className="movement-row" key={movement.id}>
                    <span className={"movement-type " + movement.movement_type}>
                      {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "−" : "≈"}
                    </span>
                    <div>
                      <b>{itemMap.get(movement.inventory_item_id) || "Item"}</b>
                      <small>{movement.reason || "Sem observação"}</small>
                    </div>
                    <strong>
                      {Number(movement.quantity).toLocaleString("pt-BR")}
                    </strong>
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
