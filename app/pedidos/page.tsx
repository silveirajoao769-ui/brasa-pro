import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  preparing: "Em preparo",
  ready: "Pronto",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("partner_orders")
    .select("id, partner_id, status, fulfillment_type, customer_name, total, created_at")
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false });

  const partnerIds = [...new Set((orders || []).map((order) => order.partner_id))];
  let partnerMap = new Map<string, string>();

  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from("partner_profiles")
      .select("id, business_name")
      .in("id", partnerIds);

    partnerMap = new Map((partners || []).map((partner) => [partner.id, partner.business_name]));
  }

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>MEUS PEDIDOS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/parceiros" className="ghost-button">Ver fornecedores</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">COMPRAS COM PARCEIROS</span>
            <h1>Meus pedidos.</h1>
            <p>Acompanhe pedidos enviados para açougues e fornecedores dentro do Brasa Pro.</p>
          </div>
          <span className="workspace-count">{orders?.length || 0} pedidos</span>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="shopping-hub-empty">
            <span>🧾</span>
            <h2>Nenhum pedido ainda.</h2>
            <p>Abra um fornecedor, monte seu pedido e acompanhe o status por aqui.</p>
            <div>
              <Link href="/parceiros" className="primary-button">Encontrar fornecedores →</Link>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Link href={"/pedidos/" + order.id} className="order-card" key={order.id}>
                <div>
                  <span>#{order.id.slice(0, 6).toUpperCase()}</span>
                  <h2>{partnerMap.get(order.partner_id) || "Fornecedor"}</h2>
                  <p>{order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"} · {order.customer_name}</p>
                </div>
                <div className="order-card-right">
                  <strong>{money(Number(order.total))}</strong>
                  <em className={"order-status " + order.status}>{statusLabels[order.status] || order.status}</em>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
