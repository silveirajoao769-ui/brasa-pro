"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calculateBarbecuePlan,
  CUT_CATALOG,
  PlannerStyle,
  STYLE_PRESETS,
} from "@/lib/planner";

const styleMap: Record<PlannerStyle, "economic" | "balanced" | "premium" | "custom"> = {
  economico: "economic",
  equilibrado: "balanced",
  premium: "premium",
  personalizado: "custom",
};

export default function QuickPlanner() {
  const router = useRouter();
  const [title, setTitle] = useState("Meu churrasco");
  const [eventDate, setEventDate] = useState("");
  const [adults, setAdults] = useState(20);
  const [children, setChildren] = useState(5);
  const [duration, setDuration] = useState(4);
  const [budget, setBudget] = useState(900);
  const [style, setStyle] = useState<PlannerStyle>("equilibrado");
  const [selectedCuts, setSelectedCuts] = useState<string[]>(STYLE_PRESETS.equilibrado);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const plan = useMemo(
    () =>
      calculateBarbecuePlan({
        adults,
        children,
        duration,
        selectedCuts,
      }),
    [adults, children, duration, selectedCuts],
  );

  const diff = budget - plan.estimate;

  function changeStyle(nextStyle: PlannerStyle) {
    setStyle(nextStyle);

    if (nextStyle !== "personalizado") {
      setSelectedCuts(STYLE_PRESETS[nextStyle]);
    }
  }

  function toggleCut(cutId: string) {
    setStyle("personalizado");
    setSelectedCuts((currentCuts) => {
      if (currentCuts.includes(cutId)) {
        if (currentCuts.length === 1) return currentCuts;
        return currentCuts.filter((id) => id !== cutId);
      }

      return [...currentCuts, cutId];
    });
  }

  async function savePlan() {
    setMessage("");

    if (plan.people < 2) {
      setMessage("Informe pelo menos 2 pessoas.");
      return;
    }

    if (selectedCuts.length === 0) {
      setMessage("Escolha pelo menos um corte.");
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

      const barbecueItems = plan.items.map((item) => ({
        barbecue_id: barbecue.id,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        source: "calculator",
      }));

      const { error: itemError } = await supabase
        .from("barbecue_items")
        .insert(barbecueItems);

      if (itemError) throw itemError;

      const { data: shoppingList, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          barbecue_id: barbecue.id,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (listError || !shoppingList) {
        throw listError || new Error("Falha ao criar lista de compras.");
      }

      const shoppingItems = plan.items.map((item) => ({
        shopping_list_id: shoppingList.id,
        category: item.category,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimatedPrice,
      }));

      const { error: shoppingError } = await supabase
        .from("shopping_list_items")
        .insert(shoppingItems);

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
          Informe convidados, duração, orçamento e cortes. O Brasa Pro transforma isso
          em quantidades reais, lista de compras e custo estimado.
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
          <select value={style} onChange={(e) => changeStyle(e.target.value as PlannerStyle)}>
            <option value="economico">Econômico</option>
            <option value="equilibrado">Equilibrado</option>
            <option value="premium">Premium</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
      </div>

      <div className="cut-planner">
        <div className="cut-planner-heading">
          <div>
            <span className="eyebrow">ESCOLHA DOS CORTES</span>
            <h4>{style === "personalizado" ? "Seu churrasco personalizado" : "Cortes sugeridos para o estilo"}</h4>
          </div>
          <small>Clique em qualquer corte para personalizar.</small>
        </div>

        <div className="cut-selector">
          {CUT_CATALOG.map((cut) => {
            const selected = selectedCuts.includes(cut.id);

            return (
              <button
                className={selected ? "cut-option selected" : "cut-option"}
                key={cut.id}
                onClick={() => toggleCut(cut.id)}
                type="button"
              >
                <span>{selected ? "✓" : "+"}</span>
                <div>
                  <b>{cut.name}</b>
                  <small>Referência R$ {cut.pricePerKg}/kg</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="people-summary">
        <span>{plan.people} convidados · {plan.meat.toFixed(1)} kg de carnes</span>
        <small>{adults} adultos · {children} crianças · {duration}h de evento</small>
      </div>

      <div className="planned-breakdown">
        <div className="planned-breakdown-heading">
          <div>
            <span className="eyebrow">PLANO CALCULADO</span>
            <h4>Quantidades e custo estimado</h4>
          </div>
          <strong>R$ {plan.estimate.toLocaleString("pt-BR")}</strong>
        </div>

        <div className="planned-items-grid">
          {plan.items.map((item) => (
            <div className="planned-item" key={item.category + item.name}>
              <span>{item.category}</span>
              <div>
                <b>{item.name}</b>
                <small>
                  {item.quantity.toLocaleString("pt-BR")} {item.unit} · R$ {item.unitPrice.toLocaleString("pt-BR")}/{item.unit}
                </small>
              </div>
              <strong>R$ {item.estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </div>
          ))}
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
        Os preços usados agora são referências do MVP e depois poderão vir de açougues e fornecedores parceiros.
      </small>
    </div>
  );
}
