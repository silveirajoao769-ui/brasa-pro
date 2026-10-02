"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PackageOption = {
  id: string;
  name: string;
  description: string;
  price_per_person: number;
  min_guests: number;
};

type PackageSnapshot = {
  package_id: string;
  name: string;
  description?: string;
  price_per_person: number;
  min_guests: number;
  charged_guests: number;
  event_guests: number;
  total_price: number;
  items?: Array<{
    category?: string;
    name?: string;
    quantity?: number | null;
    unit?: string;
    notes?: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PackageQuoteForm({
  eventId,
  guests,
  totalCosts,
  quoteId,
  packages,
}: {
  eventId: string;
  guests: number;
  totalCosts: number;
  quoteId?: string | null;
  packages: PackageOption[];
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => packages.find((item) => item.id === packageId) || packages[0],
    [packageId, packages],
  );

  const chargedGuests = selected ? Math.max(guests, selected.min_guests) : guests;
  const previewTotal = selected ? chargedGuests * Number(selected.price_per_person || 0) : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!packageId) {
      setMessage("Selecione um pacote.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: snapshotData, error: applyError } = await supabase.rpc(
      "apply_service_package_to_event",
      {
        p_event_id: eventId,
        p_package_id: packageId,
      },
    );

    if (applyError || !snapshotData) {
      setMessage(applyError?.message || "Não foi possível aplicar o pacote.");
      setLoading(false);
      return;
    }

    const snapshot = snapshotData as PackageSnapshot;
    const total = Number(snapshot.total_price || 0);
    const margin = total > 0 ? ((total - totalCosts) / total) * 100 : 0;

    const payload = {
      user_id: user.id,
      event_id: eventId,
      status: "draft",
      total_cost: totalCosts,
      margin_percent: Number(Math.max(-999, Math.min(99, margin)).toFixed(2)),
      price_total: total,
      valid_until: validUntil || null,
      service_package_id: packageId,
      service_package_snapshot: snapshot,
    };

    const result = quoteId
      ? await supabase
          .from("quotes")
          .update(payload)
          .eq("id", quoteId)
          .eq("user_id", user.id)
          .select("id")
          .single()
      : await supabase.from("quotes").insert(payload).select("id").single();

    if (result.error || !result.data) {
      setMessage(result.error?.message || "Não foi possível gerar o orçamento.");
      setLoading(false);
      return;
    }

    await supabase
      .from("events")
      .update({ status: "quote" })
      .eq("id", eventId)
      .eq("user_id", user.id);

    router.push("/orcamentos/" + result.data.id);
    router.refresh();
  }

  if (packages.length === 0) {
    return (
      <div className="compact-empty">
        <span>🍖</span>
        <b>Crie um pacote primeiro</b>
        <p>Cadastre cardápio e preço por pessoa para gerar orçamentos em poucos cliques.</p>
        <a className="primary-button" href="/pacotes">Criar pacote →</a>
      </div>
    );
  }

  return (
    <form className="package-quote-form" onSubmit={submit}>
      <label>
        Pacote
        <select value={packageId} onChange={(event) => setPackageId(event.target.value)}>
          {packages.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name} · {money(Number(item.price_per_person))}/pessoa
            </option>
          ))}
        </select>
      </label>

      <label>
        Validade da proposta
        <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
      </label>

      {selected && (
        <div className="package-quote-preview">
          <div>
            <small>PACOTE</small>
            <b>{selected.name}</b>
            <span>{selected.description || "Pacote profissional"}</span>
          </div>
          <div>
            <small>COBRANÇA</small>
            <b>{chargedGuests} pessoas</b>
            <span>Mínimo: {selected.min_guests}</span>
          </div>
          <div>
            <small>VALOR</small>
            <strong>{money(previewTotal)}</strong>
            <span>{money(Number(selected.price_per_person))}/pessoa</span>
          </div>
        </div>
      )}

      {message && <small className="cost-message">{message}</small>}

      <button className="primary-button wide" type="submit" disabled={loading}>
        {loading ? "Gerando..." : quoteId ? "Atualizar orçamento com pacote →" : "Gerar orçamento com pacote →"}
      </button>
    </form>
  );
}
