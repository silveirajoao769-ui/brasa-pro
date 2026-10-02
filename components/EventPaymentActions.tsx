"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const methods = [
  ["pix", "Pix"],
  ["cash", "Dinheiro"],
  ["card", "Cartão"],
  ["transfer", "Transferência"],
  ["other", "Outro"],
] as const;

export default function EventPaymentActions({
  paymentId,
  status,
  paymentMethod,
}: {
  paymentId: string;
  status: string;
  paymentMethod?: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState(paymentMethod || "pix");
  const [loading, setLoading] = useState(false);

  async function change(nextStatus: "pending" | "paid" | "cancelled") {
    setLoading(true);
    const supabase = createClient();

    await supabase.rpc("set_event_payment_status", {
      p_payment_id: paymentId,
      p_status: nextStatus,
      p_payment_method: nextStatus === "paid" ? method : null,
    });

    setLoading(false);
    router.refresh();
  }

  if (status === "cancelled") {
    return (
      <button className="ghost-button compact" disabled={loading} type="button" onClick={() => change("pending")}>
        {loading ? "..." : "Reativar"}
      </button>
    );
  }

  if (status === "paid") {
    return (
      <div className="receivable-paid-actions">
        <span>✓ Recebido{paymentMethod ? " · " + paymentMethod : ""}</span>
        <button className="ghost-button compact" disabled={loading} type="button" onClick={() => change("pending")}>
          {loading ? "..." : "Reabrir"}
        </button>
      </div>
    );
  }

  return (
    <div className="receivable-actions">
      <select value={method} onChange={(event) => setMethod(event.target.value)} disabled={loading}>
        {methods.map(([value, label]) => (
          <option value={value} key={value}>{label}</option>
        ))}
      </select>
      <button className="primary-button compact" disabled={loading} type="button" onClick={() => change("paid")}>
        {loading ? "..." : "Marcar recebido"}
      </button>
      <button className="ghost-button compact" disabled={loading} type="button" onClick={() => change("cancelled")}>
        Cancelar
      </button>
    </div>
  );
}
