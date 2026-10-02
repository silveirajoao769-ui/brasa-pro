import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isMarketplaceEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  if (!isMarketplaceEnabled()) redirect("/em-breve?feature=Marketplace");

  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partner_profiles")
    .select("id, business_name, slug, description, city, state, delivery_available, pickup_available")
    .eq("active", true)
    .order("business_name");

  return (
    <main className="partners-page">
      <div className="shell workspace-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PARCEIROS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/fornecedor" className="ghost-button">Sou fornecedor</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell partners-content">
        <div className="recipes-hero">
          <span className="eyebrow">AÇOUGUES E FORNECEDORES</span>
          <h1>Encontre quem pode abastecer seu próximo churrasco.</h1>
          <p>
            O marketplace está sendo preparado para conectar planejamentos do Brasa Pro a fornecedores cadastrados.
          </p>
        </div>

        {!partners || partners.length === 0 ? (
          <div className="shopping-hub-empty">
            <span>🚚</span>
            <h2>Ainda não há fornecedores publicados.</h2>
            <p>O primeiro açougue ou fornecedor poderá criar o perfil pelo portal do parceiro.</p>
            <div>
              <Link href="/fornecedor" className="primary-button">Criar perfil de fornecedor →</Link>
            </div>
          </div>
        ) : (
          <div className="partner-grid">
            {partners.map((partner) => (
              <Link href={"/parceiros/" + partner.slug} className="partner-card" key={partner.id}>
                <div className="partner-card-cover">🥩</div>
                <div className="partner-card-body">
                  <span className="recipe-type">FORNECEDOR</span>
                  <h2>{partner.business_name}</h2>
                  <p>{partner.description || "Fornecedor parceiro do Brasa Pro."}</p>
                  <div className="partner-meta">
                    <span>{[partner.city, partner.state].filter(Boolean).join(" / ") || "Local não informado"}</span>
                    <span>
                      {partner.delivery_available ? "Entrega" : ""}
                      {partner.delivery_available && partner.pickup_available ? " · " : ""}
                      {partner.pickup_available ? "Retirada" : ""}
                    </span>
                  </div>
                  <strong>Ver catálogo →</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
