"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plan = {
  people: number;
  meat: number;
  drinks: number;
  charcoal: number;
  ice: number;
  estimate: number;
};

const styleMap = {
  economico: "economic",
  equilibrado: "balanced",
  premium: "premium",
} as const;

export default function QuickPlanner() {
  const router = useRouter();
  const [title, setTitle] = useState("Meu churrasco");
  const [eventDate, setEventDate] = useState("");
  const [adults, setAdults] = useState(20);
  const [children, setChildren] = useState(5);
  const [duration, setDuration] = useState(4);
  const [budget, setBudget] = useState(900);
  const [style, setStyle] = useState<keyof typeof styleMap>("equilibrado");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const plan = useMemo<Plan>(() => {
    const people = adults + children;
    const durationFactor = Math.min(1.28, Math.max(0.9, 1 + (duration - 4) * 0.04));
    const meat = (adults * 0.42 + children * 0.22) * durationFactor;
    const drinks = Math.ceil((adults * 2.4 + children * 1.4) * durationFactor);
    const charcoal = Math.max(4, Math.ceil(meat * 0.7));
    const ice = Math.max(5, Math.ceil((adults + children * 0.6) * 0.55));

    const pricePerEquivalentGuest =
      style === "economico" ? 25 : style === "premium" ? 49 : 34;

    const equivalentGuests = adults + children * 0.55;
    const estimate = Math.round(equivalentGuests * pricePerEquivalentGuest * durationFactor);

    return {
      people,
      meat: Number(meat.toFixed(1)),
      drinks,
      charcoal,
      ice,
      estimate,
    };
  }, [adults, children, duration, style]);

  const diff = budget - plan.estimate;

  async function savePlan() {
    setMessage("");

    if (plan.people < 2) {
      setMessage("Informe pelo menos 2 pessoas.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/cadastro");
      return;
    }

    let barbecueId: string | null = null;

    try {
      const { data: barbecue, error: barbecueError } = await supabase
        .from("barbecues")
        .insert({
          user_id: user.id,
          title: title.trim() || "Meu churrasco",
          event_date: eventDate ? new Date(eventDate + "T12:00:00").toISOString() : null,
          adults,
          children,
          duration_hours: duration,
          budget: budget > 0 ? budget : null,
          style: styleMap[style],
          status: "planned",
          estimated_cost: plan.estimate,
        })
        .select("id")
        .single();

      if (barbecueError || !barbecue) {
        throw new Error(barbecueError?.message || "Não foi possível salvar o churrasco.");
      }

      barbecueId = barbecue.id;

      const { error: itemError } = await supabase.from("barbecue_items").insert([
        {
          barbecue_id: barbecue.id,
          category: "Carnes",
          name: "Carnes variadas",
          quantity: plan.meat,
          unit: "kg",
          source: "calculator",
        },
        {
          barbecue_id: barbecue.id,
          category: "Bebidas",
          name: "Bebidas variadas",
          quantity: plan.drinks,
          unit: "un",
          source: "calculator",
        },
        {
          barbecue_id: barbecue.id,
          category: "Insumos",
          name: "Carvão",
          quantity: plan.charcoal,
          unit: "kg",
          source: "calculator",
        },
        {
          barbecue_id: barbecue.id,
          category: "Insumos",
          name: "Gelo",
          quantity: plan.ice,
          unit: "kg",
          source: "calculator",
        },
      ]);

      if (itemError) throw itemError;

      const { data: shoppingList, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          barbecue_id: barbecue.id,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (listError || !shoppingList) throw listError || new Error("Falha ao criar lista de compras.");

      const { error: shoppingError } = await supabase.from("shopping_list_items").insert([
        {
          shopping_list_id: shoppingList.id,
          category: "Carnes",
          name: "Carnes variadas",
          quantity: plan.meat,
          unit: "kg",
        },
        {
          shopping_list_id: shoppingList.id,
          category: "Bebidas",
          name: "Bebidas variadas",
          quantity: plan.drinks,
          unit: "un",
        },
        {
          shopping_list_id: shoppingList.id,
          category: "Insumos",
          name: "Carvão",
          quantity: plan.charcoal,
          unit: "kg",
        },
        {
          shopping_list_id: shoppingList.id,
          category: "Insumos",
          name: "Gelo",
          quantity: plan.ice,
          unit: "kg",
        },
      ]);

      if (shoppingError) throw shoppingError;

      router.push("/churrascos/" + barbecue.id);
      router.refresh();
    } catch (error) {
      if (barbecueId) {
        await supabase.from("barbecues").delete().eq("id", barbecueId);
      }

      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o planejamento.");
      setSaving(false);
    }
  }

  return (
    <div className="planner-card">
      <div className="planner-copy">
        <span className="eyebrow">🔥 PLANEJAMENTO INTELIGENTE</span>
        <h3>Monte seu churrasco em segundos</h3>
        <p>
          Informe convidados, duração e orçamento. O Brasa Pro calcula uma primeira
          estimativa e salva tudo na sua conta.
        </p>
      </div>

      <div className="planner-form planner-form-detailed">
        <label className="planner-wide-field">
          Nome do churrasco
          <input
            type="text"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Aniversário do João"
          />
        </label>

        <label>
          Data do evento
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>

        <label>
          Adultos
          <input
            min={0}
            max={500}
            type="number"
            value={adults}
            onChange={(e) => setAdults(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>

        <label>
          Crianças
          <input
            min={0}
            max={500}
            type="number"
            value={children}
            onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>

        <label>
          Duração
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value={3}>3 horas</option>
            <option value={4}>4 horas</option>
            <option value={5}>5 horas</option>
            <option value={6}>6 horas</option>
            <option value={8}>8 horas</option>
          </select>
        </label>

        <label>
          Orçamento disponível
          <div className="money-input">
            <span>R$</span>
            <input
              min={0}
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </label>

        <label>
          Estilo
          <select value={style} onChange={(e) => setStyle(e.target.value as keyof typeof styleMap)}>
            <option value="economico">Econômico</option>
            <option value="equilibrado">Equilibrado</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <div className="people-summary">
        <span>{plan.people} convidados</span>
        <small>{adults} adultos · {children} crianças · {duration}h de evento</small>
      </div>

      <div className="plan-results">
        <div><strong>{plan.meat.toFixed(1)} kg</strong><span>Carnes</span></div>
        <div><strong>{plan.drinks}</strong><span>Bebidas</span></div>
        <div><strong>{plan.charcoal} kg</strong><span>Carvão</span></div>
        <div><strong>{plan.ice} kg</strong><span>Gelo</span></div>
        <div className="result-total">
          <strong>R$ {plan.estimate.toLocaleString("pt-BR")}</strong>
          <span>Custo estimado</span>
        </div>
      </div>

      {budget > 0 && (
        <div className={diff >= 0 ? "budget-ok" : "budget-alert"}>
          {diff >= 0
            ? "Dentro do orçamento — sobra estimada de R$ " + diff.toLocaleString("pt-BR") + "."
            : "Acima do orçamento em R$ " + Math.abs(diff).toLocaleString("pt-BR") + "."}
        </div>
      )}

      {message && <div className="planner-error">{message}</div>}

      <button className="primary-button" type="button" onClick={savePlan} disabled={saving}>
        {saving ? "Salvando planejamento..." : "Salvar planejamento e criar lista →"}
      </button>
      <small className="prototype-note">
        Estimativa inicial do MVP. Cortes, bebidas e preços específicos entram nas próximas etapas.
      </small>
    </div>
  );
}
