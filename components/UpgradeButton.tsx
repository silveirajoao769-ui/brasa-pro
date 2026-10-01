"use client";

import { useState } from "react";

export default function UpgradeButton({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function upgrade() {
    if (!enabled) {
      setMessage("O checkout do Mercado Pago ainda está sendo configurado.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/billing/mercadopago/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.initPoint) {
        setMessage(data.error || "Não foi possível iniciar o pagamento.");
        setLoading(false);
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setMessage("Não foi possível iniciar o checkout agora.");
      setLoading(false);
    }
  }

  return (
    <div className="upgrade-action">
      <button className="primary-button wide" type="button" disabled={loading} onClick={upgrade}>
        {loading ? "Abrindo Mercado Pago..." : "Assinar Brasa Pro →"}
      </button>
      {message && <small>{message}</small>}
    </div>
  );
}
