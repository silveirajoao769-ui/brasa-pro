"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  eventId: string;
  quoteId?: string | null;
  totalCosts: number;
  currentRevenue: number;
  initialMargin?: number;
  initialValidUntil?: string | null;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function QuoteForm({
  eventId,
  quoteId,
  totalCosts,
  currentRevenue,
  initialMargin = 35,
  initialValidUntil = null,
}: Props) {
  const router = useRouter();
  const [margin, setMargin] = useState(initialMargin);
  const [validUntil, setValidUntil] = useState(initialValidUntil || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const suggestedPrice = useMemo(() => {
    if (totalCosts <= 0) return currentRevenue;
    const safeMargin = Math.min(90, Math.max(0, margin));
    return totalCosts / (1 - safeMargin / 100);
  }, [totalCosts, currentRevenue, margin]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const payload = {
      user_id: user.id,
      event_id: eventId,
      status: "draft",
      total_cost: totalCosts,
      margin_percent: Math.min(90, Math.max(0, margin)),
      price_total: Number(suggestedPrice.toFixed(2)),
      valid_until: validUntil || null,
    };

    const result = quoteId
      ? await supabase.from("quotes").update(payload).eq("id", quoteId).eq("user_id", user.id).select("id").single()
      : await supabase.from("quotes").insert(payload).select("id").single();

    if (result.error || !result.data) {
      setMessage(result.error?.message || "Não foi possível salvar o orçamento.");
      setLoading(false);
      return;
    }

    setMessage("Orçamento salvo.");
    setLoading(false);
    router.push("/orcamentos/" + result.data.id);
    router.refresh();
  }

  return (
    <form className="quote-form" onSubmit={submit}>
      <div className="quote-form-grid">
        <label>
          Margem desejada
          <div className="percent-input">
            <input
              type="number"
              min={0}
              max={90}
              step={1}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 0)}
            />
            <span>%</span>
          </div>
        </label>

        <label>
          Validade
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </label>
      </div>

      <div className="quote-calculation">
        <div><span>Custos lançados</span><b>{money(totalCosts)}</b></div>
        <div><span>Margem desejada</span><b>{margin}%</b></div>
        <div className="quote-price"><span>Preço sugerido</span><strong>{money(suggestedPrice)}</strong></div>
      </div>

      {totalCosts <= 0 && (
        <small className="quote-warning">
          Lance os custos do evento para o Brasa Pro calcular um preço sugerido pela margem.
        </small>
      )}

      {message && <small className="cost-message">{message}</small>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Salvando..." : quoteId ? "Atualizar orçamento →" : "Gerar orçamento →"}
      </button>
    </form>
  );
}
