import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ShoppingChecklist from "@/components/ShoppingChecklist";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function dateLabel(value: string | null) {
  if (!value) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const styleLabels: Record<string, string> = {
  economic: "Econômico",
  balanced: "Equilibrado",
  premium: "Premium",
  custom: "Personalizado",
};

export default async function BarbecueDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: barbecue } = await supabase
    .from("barbecues")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!barbecue) notFound();

  const [{ data: items }, { data: list }] = await Promise.all([
    supabase
      .from("barbecue_items")
      .select("id, category, name, quantity, unit, unit_price")
      .eq("barbecue_id", id)
      .order("category"),
    supabase
      .from("shopping_lists")
      .select("id")
      .eq("barbecue_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  let shoppingItems: Array<{
    id: string;
    category: string;
    name: string;
    quantity: number;
    unit: string;
    checked: boolean;
    estimated_price: number | null;
  }> = [];

  if (list) {
    const { data } = await supabase
      .from("shopping_list_items")
      .select("id, category, name, quantity, unit, checked, estimated_price")
      .eq("shopping_list_id", list.id)
      .order("category");

    shoppingItems = data || [];
  }

  const guests = Number(barbecue.adults) + Number(barbecue.children);
  const budget = barbecue.budget == null ? null : Number(barbecue.budget);
  const estimated = barbecue.estimated_cost == null ? null : Number(barbecue.estimated_cost);
  const remaining = budget != null && estimated != null ? budget - estimated : null;

  return (
    <main className="detail-page">
      <div className="shell detail-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>MEUS CHURRASCOS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/planejar" className="ghost-button">+ Novo churrasco</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell detail-content">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">PLANEJAMENTO SALVO</span>
            <h1>{barbecue.title}</h1>
            <p>{dateLabel(barbecue.event_date)} · {guests} convidados · {barbecue.duration_hours}h</p>
          </div>
          <span className="detail-status">Planejado</span>
        </div>

        <div className="detail-metrics">
          <article><small>ADULTOS</small><strong>{barbecue.adults}</strong></article>
          <article><small>CRIANÇAS</small><strong>{barbecue.children}</strong></article>
          <article><small>ESTILO</small><strong>{styleLabels[barbecue.style] || barbecue.style}</strong></article>
          <article><small>CUSTO ESTIMADO</small><strong>{money(estimated)}</strong></article>
        </div>

        {budget != null && (
          <div className={remaining != null && remaining >= 0 ? "budget-summary positive-box" : "budget-summary negative-box"}>
            <div>
              <small>ORÇAMENTO</small>
              <strong>{money(budget)}</strong>
            </div>
            <div>
              <small>{remaining != null && remaining >= 0 ? "SOBRA ESTIMADA" : "ACIMA DO ORÇAMENTO"}</small>
              <strong>{money(Math.abs(remaining || 0))}</strong>
            </div>
          </div>
        )}

        <div className="detail-grid">
          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>QUANTIDADES</small><h2>Resumo do churrasco</h2></div>
            </div>

            <div className="item-table">
              {(items || []).map((item) => (
                <div className="item-table-row" key={item.id}>
                  <span className="item-category">{item.category}</span>
                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.unit_price
                        ? money(Number(item.unit_price)) + "/" + item.unit
                        : "Calculado pelo Brasa Pro"}
                    </small>
                  </div>
                  <strong>{Number(item.quantity).toLocaleString("pt-BR")} {item.unit}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>LISTA DE COMPRAS</small><h2>O que comprar</h2></div>
              <span className="list-count">{shoppingItems.length} itens</span>
            </div>

            <ShoppingChecklist items={shoppingItems} />
          </article>
        </div>

        <article className="detail-panel next-step-panel">
          <div>
            <span className="eyebrow">PLANEJAMENTO DETALHADO</span>
            <h2>Agora o Brasa Pro já calcula cortes reais e lista de compras.</h2>
            <p>
              O próximo passo será permitir trocar quantidades manualmente, ajustar preços
              locais e transformar o planejamento em orçamento profissional com um clique.
            </p>
          </div>
          <Link href="/planejar" className="primary-button">Criar outro planejamento →</Link>
        </article>
      </section>
    </main>
  );
}
