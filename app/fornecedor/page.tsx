import Link from "next/link";
import { redirect } from "next/navigation";
import PartnerProfileForm from "@/components/PartnerProfileForm";
import PartnerProductForm from "@/components/PartnerProductForm";
import PartnerProductEditor from "@/components/PartnerProductEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function SupplierPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Portal do fornecedor");

  const [{ data: profile }, { data: products }, { data: orders }] = await Promise.all([
    supabase
      .from("partner_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("partner_products")
      .select("id, name, category, description, unit, price, active, created_at")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_orders")
      .select("id, status, fulfillment_type, customer_name, total, created_at")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const activeProducts = (products || []).filter((product) => product.active).length;
  const pendingOrders = (orders || []).filter((order) =>
    ["pending", "accepted", "preparing", "ready"].includes(order.status),
  ).length;
  const orderRevenue = (orders || [])
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PORTAL DO FORNECEDOR</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/parceiros" className="ghost-button">Ver marketplace</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">AÇOUGUES E FORNECEDORES</span>
            <h1>Venda para quem já está planejando comprar.</h1>
            <p>
              Monte seu perfil, publique produtos e prepare a estrutura para receber pedidos dentro do Brasa Pro.
            </p>
          </div>
          {profile?.slug && (
            <Link href={"/parceiros/" + profile.slug} className="workspace-count">
              Ver perfil público →
            </Link>
          )}
        </div>

        <div className="supplier-overview">
          <article>
            <small>PRODUTOS ATIVOS</small>
            <strong>{activeProducts}</strong>
            <span>No seu catálogo</span>
          </article>
          <article>
            <small>PEDIDOS ABERTOS</small>
            <strong>{pendingOrders}</strong>
            <span>Precisando de atenção</span>
          </article>
          <article>
            <small>PEDIDOS RECEBIDOS</small>
            <strong>{orders?.length || 0}</strong>
            <span>Histórico recente</span>
          </article>
          <article>
            <small>VALOR EM PEDIDOS</small>
            <strong>{money(orderRevenue)}</strong>
            <span>Pedidos não cancelados</span>
          </article>
        </div>

        <div className="supplier-form-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>PERFIL PÚBLICO</small><h2>Sua empresa</h2></div>
            </div>
            <PartnerProfileForm initial={profile} />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CATÁLOGO</small><h2>Novo produto</h2></div>
            </div>
            <PartnerProductForm enabled={Boolean(profile)} />
          </article>
        </div>

        <div className="supplier-content-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SEUS PRODUTOS</small><h2>Catálogo publicado</h2></div>
            </div>

            {!products || products.length === 0 ? (
              <div className="compact-empty">
                <span>🥩</span>
                <b>Nenhum produto publicado</b>
                <p>Salve o perfil e cadastre o primeiro item do catálogo.</p>
              </div>
            ) : (
              <div className="partner-product-list">
                {products.map((product) => (
                  <div className="partner-product-row" key={product.id}>
                    <span>🥩</span>
                    <div>
                      <b>{product.name}</b>
                      <small>{product.category}</small>
                    </div>
                    <div>
                      <strong>{money(Number(product.price))}/{product.unit}</strong>
                      <small>{product.active ? "Ativo" : "Pausado"}</small>
                    </div>
                    <PartnerProductEditor product={product} />
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>PEDIDOS</small><h2>Pedidos recebidos</h2></div>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="compact-empty">
                <span>🧾</span>
                <b>Nenhum pedido ainda</b>
                <p>Quando o fluxo de pedidos estiver ativo, eles aparecerão aqui.</p>
              </div>
            ) : (
              <div className="partner-order-list">
                {orders.map((order) => (
                  <Link href={"/pedidos/" + order.id} className="partner-order-row" key={order.id}>
                    <span>#{order.id.slice(0, 6).toUpperCase()}</span>
                    <div>
                      <b>{order.customer_name}</b>
                      <small>{order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"} · {order.status}</small>
                    </div>
                    <strong>{money(Number(order.total))}</strong>
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
