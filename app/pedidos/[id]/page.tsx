import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderStatusForm from "@/components/OrderStatusForm";
import { createClient } from "@/lib/supabase/server";

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

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  preparing: "Em preparo",
  ready: "Pronto",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const steps = ["pending", "accepted", "preparing", "ready", "completed"];

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("partner_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const isPartner = order.partner_id === user.id;
  const isBuyer = order.buyer_user_id === user.id;

  if (!isPartner && !isBuyer) notFound();

  const [{ data: items }, { data: partner }] = await Promise.all([
    supabase
      .from("partner_order_items")
      .select("id, product_name, quantity, unit, unit_price, subtotal")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("partner_profiles")
      .select("business_name, slug, phone, email, city, state")
      .eq("id", order.partner_id)
      .maybeSingle(),
  ]);

  const currentStep = steps.indexOf(order.status);

  return (
    <main className="order-detail-page">
      <div className="shell workspace-topbar">
        <Link href={isPartner ? "/fornecedor" : "/pedidos"} className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PEDIDO</small></span>
        </Link>
        <div className="detail-actions">
          <Link href={isPartner ? "/fornecedor" : "/pedidos"} className="ghost-button">← Voltar</Link>
        </div>
      </div>

      <section className="shell order-detail-content">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">PEDIDO #{id.slice(0, 6).toUpperCase()}</span>
            <h1>{partner?.business_name || "Fornecedor parceiro"}</h1>
            <p>
              {order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"} · {order.customer_name}
            </p>
          </div>
          <span className={"order-status large " + order.status}>{statusLabels[order.status] || order.status}</span>
        </div>

        {order.status !== "cancelled" && (
          <div className="order-timeline">
            {steps.map((step, index) => (
              <div className={index <= currentStep ? "active" : ""} key={step}>
                <span>{index + 1}</span>
                <small>{statusLabels[step]}</small>
              </div>
            ))}
          </div>
        )}

        <div className="order-detail-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>ITENS</small><h2>Resumo do pedido</h2></div>
              <strong className="order-total">{money(Number(order.total))}</strong>
            </div>

            <div className="order-items-list">
              {(items || []).map((item) => (
                <div className="order-item-row" key={item.id}>
                  <div>
                    <b>{item.product_name}</b>
                    <small>{Number(item.quantity).toLocaleString("pt-BR")} {item.unit} × {money(Number(item.unit_price))}</small>
                  </div>
                  <strong>{money(Number(item.subtotal))}</strong>
                </div>
              ))}
            </div>

            {order.notes && (
              <div className="order-notes">
                <small>OBSERVAÇÕES</small>
                <p>{order.notes}</p>
              </div>
            )}
          </article>

          <aside className="workspace-panel">
            <div className="panel-heading">
              <div><small>{isPartner ? "GESTÃO" : "FORNECEDOR"}</small><h2>{isPartner ? "Atualizar pedido" : "Contato"}</h2></div>
            </div>

            {isPartner ? (
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            ) : (
              <div className="order-contact">
                <b>{partner?.business_name || "Fornecedor"}</b>
                <span>{[partner?.city, partner?.state].filter(Boolean).join(" / ") || "Local não informado"}</span>
                <span>{partner?.phone || partner?.email || "Contato não informado"}</span>
                {partner?.slug && <Link href={"/parceiros/" + partner.slug} className="ghost-button">Ver catálogo</Link>}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
