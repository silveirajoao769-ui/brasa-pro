import Link from "next/link";
import { redirect } from "next/navigation";
import ShoppingChecklist from "@/components/ShoppingChecklist";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id, barbecue_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listIds = (lists || []).map((list) => list.id);
  const barbecueIds = (lists || []).map((list) => list.barbecue_id);

  const [{ data: items }, { data: barbecues }] = await Promise.all([
    listIds.length
      ? supabase
          .from("shopping_list_items")
          .select("id, shopping_list_id, category, name, quantity, unit, estimated_price, checked")
          .in("shopping_list_id", listIds)
          .order("category", { ascending: true })
      : Promise.resolve({ data: [] }),
    barbecueIds.length
      ? supabase
          .from("barbecues")
          .select("id, title, event_date, adults, children")
          .eq("user_id", user.id)
          .in("id", barbecueIds)
      : Promise.resolve({ data: [] }),
  ]);

  const barbecueMap = new Map((barbecues || []).map((barbecue) => [barbecue.id, barbecue]));
  const groupedItems = new Map<string, typeof items>();

  for (const item of items || []) {
    const current = groupedItems.get(item.shopping_list_id) || [];
    current.push(item);
    groupedItems.set(item.shopping_list_id, current);
  }

  const totalLists = lists?.length || 0;
  const totalItems = (items || []).length;
  const checkedItems = (items || []).filter((item) => item.checked).length;
  const estimatedTotal = (items || []).reduce(
    (sum, item) => sum + Number(item.estimated_price || 0),
    0,
  );

  return (
    <main className="shopping-hub-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>LISTAS DE COMPRAS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/planejar" className="ghost-button">+ Novo churrasco</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell shopping-hub-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">COMPRAS ORGANIZADAS</span>
            <h1>Suas listas de compras.</h1>
            <p>
              Cada planejamento gera sua própria lista. Marque o que já comprou e acompanhe
              tudo em um único lugar.
            </p>
          </div>
          <span className="workspace-count">{totalLists} listas</span>
        </div>

        <div className="shopping-hub-stats">
          <article><small>ITENS</small><strong>{totalItems}</strong><span>Em todas as listas</span></article>
          <article><small>COMPRADOS</small><strong>{checkedItems}</strong><span>Itens concluídos</span></article>
          <article><small>FALTAM</small><strong>{Math.max(0, totalItems - checkedItems)}</strong><span>Itens pendentes</span></article>
          <article><small>ESTIMATIVA</small><strong>{money(estimatedTotal)}</strong><span>Valor somado das listas</span></article>
        </div>

        {!lists || lists.length === 0 ? (
          <div className="shopping-hub-empty">
            <span>🛒</span>
            <h2>Você ainda não tem uma lista.</h2>
            <p>Crie um churrasco pela calculadora ou pela IA Brasa e a lista aparece aqui automaticamente.</p>
            <div>
              <Link href="/planejar" className="ghost-button">Usar calculadora</Link>
              <Link href="/ia-brasa" className="primary-button">Planejar com IA →</Link>
            </div>
          </div>
        ) : (
          <div className="shopping-lists-stack">
            {lists.map((list) => {
              const barbecue = barbecueMap.get(list.barbecue_id);
              const listItems = groupedItems.get(list.id) || [];
              const subtotal = listItems.reduce(
                (sum, item) => sum + Number(item.estimated_price || 0),
                0,
              );
              const guests = barbecue
                ? Number(barbecue.adults || 0) + Number(barbecue.children || 0)
                : 0;

              return (
                <article className="shopping-list-card" key={list.id}>
                  <div className="shopping-list-card-header">
                    <div>
                      <small>LISTA DE COMPRAS</small>
                      <h2>{barbecue?.title || "Churrasco"}</h2>
                      <p>{guests} convidados · {listItems.length} itens</p>
                    </div>

                    <div className="shopping-list-card-actions">
                      <div><small>ESTIMATIVA</small><strong>{money(subtotal)}</strong></div>
                      <Link href={"/churrascos/" + list.barbecue_id} className="ghost-button">
                        Ver churrasco →
                      </Link>
                      <Link href="/parceiros" className="primary-button compact">
                        Comprar com parceiro
                      </Link>
                    </div>
                  </div>

                  <ShoppingChecklist
                    items={listItems.map((item) => ({
                      id: item.id,
                      category: item.category,
                      name: item.name,
                      quantity: Number(item.quantity),
                      unit: item.unit,
                      checked: Boolean(item.checked),
                      estimated_price:
                        item.estimated_price == null ? null : Number(item.estimated_price),
                    }))}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
