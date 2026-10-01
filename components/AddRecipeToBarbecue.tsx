"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BarbecueOption = {
  id: string;
  title: string;
  guests: number;
};

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

type Props = {
  recipeTitle: string;
  recipeServings: number;
  ingredients: Ingredient[];
  barbecues: BarbecueOption[];
  isLoggedIn: boolean;
};

export default function AddRecipeToBarbecue({
  recipeTitle,
  recipeServings,
  ingredients,
  barbecues,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [barbecueId, setBarbecueId] = useState(barbecues[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => barbecues.find((barbecue) => barbecue.id === barbecueId),
    [barbecueId, barbecues],
  );

  const multiplier = selected
    ? Math.max(1, selected.guests / Math.max(1, recipeServings))
    : 1;

  async function addRecipe() {
    setMessage("");

    if (!isLoggedIn) {
      router.push("/cadastro");
      return;
    }

    if (!barbecueId) {
      setMessage("Crie um churrasco primeiro para adicionar esta receita.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: barbecue, error: barbecueError } = await supabase
      .from("barbecues")
      .select("id")
      .eq("id", barbecueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (barbecueError || !barbecue) {
      setMessage("Não foi possível acessar este churrasco.");
      setLoading(false);
      return;
    }

    const recipeItems = ingredients.map((ingredient) => ({
      barbecue_id: barbecueId,
      category: "Receita",
      name: ingredient.name + " · " + recipeTitle,
      quantity: Math.round(ingredient.quantity * multiplier * 1000) / 1000,
      unit: ingredient.unit,
      unit_price: null,
      source: "recipe",
    }));

    const { error: itemsError } = await supabase
      .from("barbecue_items")
      .insert(recipeItems);

    if (itemsError) {
      setMessage(itemsError.message);
      setLoading(false);
      return;
    }

    let { data: list } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("barbecue_id", barbecueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!list) {
      const created = await supabase
        .from("shopping_lists")
        .insert({ barbecue_id: barbecueId, user_id: user.id })
        .select("id")
        .single();

      if (created.error || !created.data) {
        setMessage("Receita adicionada ao churrasco, mas não foi possível criar a lista.");
        setLoading(false);
        return;
      }

      list = created.data;
    }

    const shoppingItems = ingredients.map((ingredient) => ({
      shopping_list_id: list!.id,
      category: "Receita · " + recipeTitle,
      name: ingredient.name,
      quantity: Math.round(ingredient.quantity * multiplier * 1000) / 1000,
      unit: ingredient.unit,
      estimated_price: null,
    }));

    const { error: shoppingError } = await supabase
      .from("shopping_list_items")
      .insert(shoppingItems);

    if (shoppingError) {
      setMessage("Receita adicionada, mas alguns itens não entraram na lista de compras.");
      setLoading(false);
      return;
    }

    setMessage("Receita adicionada ao churrasco e à lista de compras.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="add-recipe-card">
      <span className="eyebrow">ADICIONAR AO PLANEJAMENTO</span>
      <h3>Leve esta receita para o seu churrasco</h3>
      <p>
        O Brasa Pro ajusta os ingredientes conforme o número de convidados do planejamento escolhido.
      </p>

      {isLoggedIn && barbecues.length > 0 ? (
        <>
          <label>
            Escolha o churrasco
            <select value={barbecueId} onChange={(e) => setBarbecueId(e.target.value)}>
              {barbecues.map((barbecue) => (
                <option value={barbecue.id} key={barbecue.id}>
                  {barbecue.title} · {barbecue.guests} pessoas
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <div className="recipe-scale">
              <span>Receita base</span>
              <b>{recipeServings} pessoas</b>
              <span>Planejamento</span>
              <b>{selected.guests} pessoas</b>
              <span>Multiplicador</span>
              <b>{multiplier.toFixed(1)}×</b>
            </div>
          )}
        </>
      ) : isLoggedIn ? (
        <div className="recipe-empty-plan">
          Você ainda não tem um churrasco salvo.
        </div>
      ) : null}

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" onClick={addRecipe} disabled={loading} type="button">
        {loading
          ? "Adicionando..."
          : !isLoggedIn
            ? "Criar conta para adicionar →"
            : barbecues.length === 0
              ? "Criar meu primeiro churrasco →"
              : "Adicionar receita ao churrasco →"}
      </button>
    </div>
  );
}
