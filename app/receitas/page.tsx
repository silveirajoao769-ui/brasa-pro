import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Avançada",
};

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function recipeIcon(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("pão")) return "🥖";
  if (normalized.includes("farofa")) return "🥓";
  if (normalized.includes("vinagrete")) return "🍅";
  return "🥩";
}

export default async function RecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, prep_minutes, servings, difficulty, estimated_cost")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  return (
    <main className="recipes-page">
      <div className="shell workspace-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>RECEITAS E FICHAS TÉCNICAS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/planejar" className="ghost-button">Planejar churrasco</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell recipes-content">
        <div className="recipes-hero">
          <span className="eyebrow">CONTEÚDO QUE VIRA PLANEJAMENTO</span>
          <h1>Receitas feitas para entrar direto no churrasco.</h1>
          <p>
            Veja preparo, rendimento, custo estimado e ingredientes. Depois adicione a receita
            ao seu planejamento e à lista de compras com um clique.
          </p>
        </div>

        <div className="recipe-grid">
          {(recipes || []).map((recipe) => (
            <Link href={"/receitas/" + recipe.id} className="recipe-library-card" key={recipe.id}>
              <div className="recipe-cover">
                <span>{recipeIcon(recipe.title)}</span>
                <small>BRASA PRO</small>
              </div>
              <div className="recipe-library-body">
                <span className="recipe-type">RECEITA</span>
                <h2>{recipe.title}</h2>
                <p>{recipe.description}</p>

                <div className="recipe-meta">
                  <span>⏱ {recipe.prep_minutes || "—"} min</span>
                  <span>👥 {recipe.servings || "—"} pessoas</span>
                  <span>◆ {recipe.difficulty ? difficultyLabel[recipe.difficulty] : "—"}</span>
                </div>

                <div className="recipe-card-footer">
                  <div><small>CUSTO ESTIMADO</small><b>{money(recipe.estimated_cost == null ? null : Number(recipe.estimated_cost))}</b></div>
                  <span>Ver receita →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
