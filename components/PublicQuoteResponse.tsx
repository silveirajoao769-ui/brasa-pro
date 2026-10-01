"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PublicQuoteResponse({
  token,
  status,
}: {
  token: string;
  status: string;
}) {
  const [message, setMessage] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);

  async function respond(decision: "approved" | "rejected") {
    setLoading(decision);
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.rpc("respond_public_quote", {
      p_token: token,
      p_decision: decision,
      p_message: clientMessage,
    });

    if (error || !data) {
      setMessage("Não foi possível registrar a resposta. A proposta pode ter expirado.");
      setLoading(null);
      return;
    }

    setCurrentStatus(decision);
    setMessage(decision === "approved" ? "Proposta aprovada com sucesso." : "Proposta recusada.");
    setLoading(null);
  }

  if (currentStatus === "approved") {
    return (
      <div className="public-quote-response success">
        <span>✓</span>
        <div>
          <b>Proposta aprovada</b>
          <p>O profissional já poderá ver sua aprovação no Brasa Pro.</p>
        </div>
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="public-quote-response rejected">
        <span>×</span>
        <div>
          <b>Proposta recusada</b>
          <p>Sua resposta foi registrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-quote-action-card">
      <span className="eyebrow">RESPOSTA DO CLIENTE</span>
      <h2>Aprovar esta proposta?</h2>
      <p>Você pode deixar uma observação antes de confirmar sua decisão.</p>

      <textarea
        rows={4}
        maxLength={1000}
        value={clientMessage}
        onChange={(e) => setClientMessage(e.target.value)}
        placeholder="Ex.: Gostaria de ajustar o horário de início..."
      />

      <div className="public-quote-buttons">
        <button
          className="ghost-button"
          type="button"
          disabled={Boolean(loading)}
          onClick={() => respond("rejected")}
        >
          {loading === "rejected" ? "Enviando..." : "Recusar"}
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={Boolean(loading)}
          onClick={() => respond("approved")}
        >
          {loading === "approved" ? "Confirmando..." : "Aprovar proposta"}
        </button>
      </div>

      {message && <small>{message}</small>}
    </div>
  );
}
