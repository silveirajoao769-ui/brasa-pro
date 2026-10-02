import Link from "next/link";
import { notFound } from "next/navigation";
import PartnerOrderForm from "@/components/PartnerOrderForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PartnerDetailPage({ params }: PageProps) {
  if (!isMarketplaceEnabled()) redirect("/em-breve?feature=Marketplace");

  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: partner }, authResult] = await Promise.all([
    supabase
      .from("partner_profiles")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!partner) notFound();

  const { data: products } = await supabase
    .from("partner_products")
    .select("id, name, category, description, unit, price")
    .eq("partner_id", partner.id)
    .eq("active", true)
    .order("category")
    .order("name");

  const user = authResult.data.user;

  return (
    <main className="partners-page">
      <div className="shell workspace-topbar">
        <Link href="/parceiros" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CATÁLOGO DO PARCEIRO</small></span>
        </Link>
        <div className="detail-actions">
          {user && <Link href="/pedidos" className="ghost-button">Meus pedidos</Link>}
          <Link href="/parceiros" className="ghost-button">← Parceiros</Link>
        </div>
      </div>

      <section className="shell partners-content">
        <div className="partner-profile-hero">
          <div className="partner-profile-icon">🥩</div>
          <div>
            <span className="eyebrow">FORNECEDOR PARCEIRO</span>
            <h1>{partner.business_name}</h1>
            <p>{partner.description || "Fornecedor parceiro do Brasa Pro."}</p>
            <div className="partner-profile-meta">
              <span>{[partner.city, partner.state].filter(Boolean).join(" / ") || "Local não informado"}</span>
              {partner.pickup_available && <span>✓ Retirada</span>}
              {partner.delivery_available && <span>✓ Entrega</span>}
            </div>
          </div>
        </div>

        <div className="partner-catalog-heading">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2>Produtos disponíveis</h2>
          </div>
          <span>{products?.length || 0} produtos</span>
        </div>

        {!products || products.length === 0 ? (
          <div className="compact-empty">
            <span>🥩</span>
            <b>Catálogo ainda vazio</b>
            <p>Este fornecedor ainda não publicou produtos.</p>
          </div>
        ) : (
          <>
            <div className="partner-product-grid">
              {products.map((product) => (
                <article className="partner-catalog-card" key={product.id}>
                  <div className="partner-catalog-icon">🥩</div>
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || "Produto disponível no catálogo do parceiro."}</p>
                  <div>
                    <strong>{money(Number(product.price))}</strong>
                    <small>/ {product.unit}</small>
                  </div>
                </article>
              ))}
            </div>

            <div className="partner-order-section">
              <PartnerOrderForm
                partnerId={partner.id}
                partnerName={partner.business_name}
                products={products.map((product) => ({
                  id: product.id,
                  name: product.name,
                  unit: product.unit,
                  price: Number(product.price),
                }))}
                deliveryAvailable={Boolean(partner.delivery_available)}
                pickupAvailable={Boolean(partner.pickup_available)}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
