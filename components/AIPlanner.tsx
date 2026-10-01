"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AIItem = {
  category: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  estimatedPrice: number;
};

type AIPlan = {
  title: string;
  adults: number;
  children: number;
  durationHours: number;
  budget: number;
  style: "economic" | "balanced" | "premium" | "custom";
  summary: string;
  tips: string[];
  estimate: number;
  items: AIItem[];
  engine: "openai" | "rules";
};

const examples = [
  "Vou fazer um churrasco para 35 pessoas, quero picanha, costela e linguiça e tenho R$ 1.500.",
  "Churrasco econômico para 20 pessoas durante 4 horas, com bastante carne e pão de alho.",
  "Evento premium para 60 convidados, quero picanha, ancho, costela e acompanhamentos.",
];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function AIPlanner() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(examples[0]);
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    setPlan(null);

    try {
      const response = await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || !data.plan) {
        setMessage(data.error || "Não foi possível montar o planejamento.");
        setLoading(false);
        return;
      }

      setPlan(data.plan);
    } catch {
      setMessage("Não foi possível conversar com a IA Brasa agora.");
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!plan) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let barbecueId: string | null = null;

    try {
      const { data: barbecue, error: barbecueError } = await supabase
        .from("barbecues")
        .insert({
          user_id: user.id,
          title: plan.title || "Churrasco planejado com IA Brasa",
          adults: Math.max(1, plan.adults),
          children: Math.max(0, plan.children),
          duration_hours: Math.max(2, plan.durationHours),
          budget: plan.budget > 0 ? plan.budget : null,
          style: plan.style,
          status: "planned",
          notes: "Planejamento criado pela IA Brasa. " + plan.summary,
          estimated_cost: Math.max(0, plan.estimate),
        })
        .select("id")
        .single();

      if (barbecueError || !barbecue) {
        throw new Error(barbecueError?.message || "Não foi possível salvar o planejamento.");
      }

      barbecueId = barbecue.id;

      const safeItems = plan.items
        .filter((item) => item.name && item.quantity > 0)
        .slice(0, 40);

      const { error: itemsError } = await supabase.from("barbecue_items").insert(
        safeItems.map((item) => ({
          barbecue_id: barbecue.id,
          category: item.category || "Planejamento",
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "un",
          unit_price: Math.max(0, item.unitPrice || 0),
          source: "ai",
        })),
      );

      if (itemsError) throw itemsError;

      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          barbecue_id: barbecue.id,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (listError || !list) throw listError || new Error("Não foi possível criar a lista.");

      const { error: shoppingError } = await supabase
        .from("shopping_list_items")
        .insert(
          safeItems.map((item) => ({
            shopping_list_id: list.id,
            category: item.category || "Planejamento",
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || "un",
            estimated_price: Math.max(0, item.estimatedPrice || 0),
          })),
        );

      if (shoppingError) throw shoppingError;

      router.push("/churrascos/" + barbecue.id);
      router.refresh();
    } catch (error) {
      if (barbecueId) {
        await supabase.from("barbecues").delete().eq("id", barbecueId);
      }

      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  return (
    <div className="ai-brasa-workspace">
      <form className="ai-prompt-card" onSubmit={generate}>
        <div className="ai-prompt-heading">
          <div>
            <span className="eyebrow">✦ IA BRASA</span>
            <h2>Conte como você imagina o churrasco.</h2>
          </div>
          <span className="ai-live-badge">BETA</span>
        </div>

        <textarea
          maxLength={1200}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex.: churrasco para 30 pessoas, R$ 1.200, quero picanha, linguiça, pão de alho e bebidas..."
          rows={7}
        />

        <div className="ai-prompt-footer">
          <small>{prompt.length}/1200 caracteres</small>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Montando seu churrasco..." : "Gerar planejamento →"}
          </button>
        </div>

        <div className="ai-examples">
          <small>EXEMPLOS</small>
          {examples.map((example, index) => (
            <button type="button" onClick={() => setPrompt(example)} key={index}>
              {index + 1}. {example}
            </button>
          ))}
        </div>

        {message && <div className="form-message">{message}</div>}
      </form>

      <section className="ai-result-card">
        {!plan ? (
          <div className="ai-empty-result">
            <span>🔥</span>
            <h3>Seu plano vai aparecer aqui.</h3>
            <p>
              A IA interpreta convidados, orçamento, cortes e estilo para montar um
              churrasco completo.
            </p>
          </div>
        ) : (
          <>
            <div className="ai-result-heading">
              <div>
                <span className="eyebrow">PLANO GERADO</span>
                <h2>{plan.title}</h2>
                <p>{plan.summary}</p>
              </div>
              <span className="ai-engine">
                {plan.engine === "openai" ? "IA conectada" : "Modo inteligente local"}
              </span>
            </div>

            <div className="ai-result-stats">
              <div><small>CONVIDADOS</small><strong>{plan.adults + plan.children}</strong></div>
              <div><small>DURAÇÃO</small><strong>{plan.durationHours}h</strong></div>
              <div><small>ORÇAMENTO</small><strong>{plan.budget > 0 ? money(plan.budget) : "Livre"}</strong></div>
              <div><small>ESTIMATIVA</small><strong>{money(plan.estimate)}</strong></div>
            </div>

            {plan.budget > 0 && (
              <div className={plan.estimate <= plan.budget ? "budget-ok" : "budget-alert"}>
                {plan.estimate <= plan.budget
                  ? "Plano dentro do orçamento por aproximadamente " + money(plan.budget - plan.estimate) + "."
                  : "Plano acima do orçamento por aproximadamente " + money(plan.estimate - plan.budget) + "."}
              </div>
            )}

            <div className="ai-plan-items">
              {plan.items.map((item, index) => (
                <div className="ai-plan-item" key={item.category + item.name + index}>
                  <span>{item.category}</span>
                  <div>
                    <b>{item.name}</b>
                    <small>{item.quantity.toLocaleString("pt-BR")} {item.unit}</small>
                  </div>
                  <strong>{money(item.estimatedPrice)}</strong>
                </div>
              ))}
            </div>

            <div className="ai-tips">
              <small>DICAS DA IA BRASA</small>
              {plan.tips.map((tip, index) => (
                <p key={index}><span>✓</span>{tip}</p>
              ))}
            </div>

            <button className="primary-button wide" type="button" onClick={savePlan} disabled={saving}>
              {saving ? "Salvando na sua conta..." : "Salvar este plano e criar lista de compras →"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
