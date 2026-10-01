import Link from "next/link";
import { notFound } from "next/navigation";
import AddRecipeToBarbecue from "@/components/AddRecipeToBarbecue";
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

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Avançada",
};

function recipeIcon(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("pão")) return "🥖";
  if (normalized.includes("farofa")) return "🥓";
  if (normalized.includes("vinagrete")) return "🍅";
  return "🥩";
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recipe }, { data: ingredients }, authResult] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, description, prep_minutes, servings, difficulty, estimated_cost, instructions, is_public")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipe_ingredients")
      .select("id, name, quantity, unit")
      .eq("recipe_id", id)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!recipe || !recipe.is_public) notFound();

  const user = authResult.data.user;
  let barbecues: Array<{ id: string; title: string; guests: number }> = [];

  if (user) {
    const { data } = await supabase
      .from("barbecues")
      .select("id, title, adults, children, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    barbecues = (data || []).map((barbecue) => ({
      id: barbecue.id,
      title: barbecue.title,
      guests: Number(barbecue.adults || 0) + Number(barbecue.children || 0),
    }));
  }

  return (
    <main className="recipe-detail-page">
      <div className="shell workspace-topbar">
        <Link href="/receitas" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>FICHA TÉCNICA</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/receitas" className="ghost-button">← Receitas</Link>
          <Link href="/planejar" className="primary-button compact">Planejar churrasco</Link>
        </div>
      </div>

      <section className="shell recipe-detail-content">
        <div className="recipe-detail-hero">
          <div className="recipe-detail-cover">
            <span>{recipeIcon(recipe.title)}</span>
            <small>RECEITA BRASA PRO</small>
          </div>

          <div className="recipe-detail-copy">
            <span className="eyebrow">RECEITA + FICHA TÉCNICA</span>
            <h1>{recipe.title}</h1>
            <p>{recipe.description}</p>

            <div className="recipe-detail-meta">
              <div><small>TEMPO</small><strong>{recipe.prep_minutes || "—"} min</strong></div>
              <div><small>RENDIMENTO</small><strong>{recipe.servings || "—"} pessoas</strong></div>
              <div><small>DIFICULDADE</small><strong>{recipe.difficulty ? difficultyLabel[recipe.difficulty] : "—"}</strong></div>
              <div><small>CUSTO ESTIMADO</small><strong>{money(recipe.estimated_cost == null ? null : Number(recipe.estimated_cost))}</strong></div>
            </div>
          </div>
        </div>

        <div className="recipe-detail-grid">
          <div className="recipe-main-column">
            <article className="recipe-detail-panel">
              <div className="panel-heading">
                <div><small>INGREDIENTES</small><h2>Ficha técnica</h2></div>
                <span className="list-count">{ingredients?.length || 0} itens</span>
              </div>

              <div className="ingredient-list">
                {(ingredients || []).map((ingredient) => (
                  <div className="ingredient-row" key={ingredient.id}>
                    <span>•</span>
                    <b>{ingredient.name}</b>
                    <strong>{Number(ingredient.quantity).toLocaleString("pt-BR")} {ingredient.unit}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="recipe-detail-panel">
              <div className="panel-heading">
                <div><small>PREPARO</small><h2>Passo a passo</h2></div>
              </div>
              <div className="recipe-instructions">
                <p>{recipe.instructions}</p>
              </div>
            </article>
          </div>

          <aside className="recipe-side-column">
            <AddRecipeToBarbecue
              recipeTitle={recipe.title}
              recipeServings={Number(recipe.servings || 1)}
              ingredients={(ingredients || []).map((ingredient) => ({
                name: ingredient.name,
                quantity: Number(ingredient.quantity),
                unit: ingredient.unit,
              }))}
              barbecues={barbecues}
              isLoggedIn={Boolean(user)}
            />

            <div className="recipe-tip-card">
              <span>🔥</span>
              <div>
                <small>DICA BRASA PRO</small>
                <b>Evite desperdício</b>
                <p>
                  Ao adicionar a receita a um churrasco, as quantidades são ajustadas
                  automaticamente ao número de convidados.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
