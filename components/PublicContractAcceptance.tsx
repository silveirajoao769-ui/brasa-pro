"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PublicContractAcceptance({
  token,
  status,
  acceptedName,
}: {
  token: string;
  status: string;
  acceptedName?: string | null;
}) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentAcceptedName, setCurrentAcceptedName] = useState(acceptedName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!agreed) {
      setMessage("Confirme que você leu e concorda com os termos.");
      return;
    }

    if (name.trim().length < 3) {
      setMessage("Digite seu nome completo para registrar o aceite.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_public_contract", {
      p_token: token,
      p_accepted_name: name.trim(),
    });

    if (error || !data) {
      setMessage("Não foi possível registrar o aceite. Atualize a página e tente novamente.");
      setLoading(false);
      return;
    }

    setCurrentStatus("accepted");
    setCurrentAcceptedName(name.trim());
    setMessage("");
    setLoading(false);
  }

  if (currentStatus === "accepted") {
    return (
      <div className="public-quote-response success">
        <span>✓</span>
        <div>
          <b>Contrato aceito eletronicamente</b>
          <p>Aceite registrado em nome de {currentAcceptedName || "cliente"}.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="public-quote-action-card contract-accept-card" onSubmit={accept}>
      <span className="eyebrow">ACEITE ELETRÔNICO</span>
      <h2>Confirmar este contrato</h2>
      <p>
        Digite seu nome completo e confirme que leu os termos exibidos nesta página.
      </p>

      <label className="contract-field">
        <span>Nome completo</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={160}
          autoComplete="name"
          placeholder="Seu nome completo"
        />
      </label>

      <label className="contract-check">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>Li e concordo com os termos deste contrato.</span>
      </label>

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Registrando..." : "Aceitar contrato"}
      </button>

      {message && <small>{message}</small>}
    </form>
  );
}
