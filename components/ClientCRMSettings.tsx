"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientCRMSettings({
  clientId,
  initialStage,
  initialSource,
  initialFollowUp,
}: {
  clientId: string;
  initialStage: string;
  initialSource?: string | null;
  initialFollowUp?: string | null;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [source, setSource] = useState(initialSource || "");
  const [followUp, setFollowUp] = useState(
    initialFollowUp ? new Date(initialFollowUp).toISOString().slice(0, 16) : "",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_client_crm", {
      p_client_id: clientId,
      p_stage: stage,
      p_source: source || null,
      p_next_follow_up_at: followUp ? new Date(followUp).toISOString() : null,
    });

    if (error || !data) {
      setMessage(error?.message || "Não foi possível atualizar o CRM.");
      setLoading(false);
      return;
    }

    setMessage("CRM atualizado.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form crm-settings-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label>
          Etapa
          <select value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="lead">Lead</option>
            <option value="contacted">Contato feito</option>
            <option value="proposal">Proposta enviada</option>
            <option value="customer">Cliente</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        <label>
          Origem
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Instagram, indicação, Google..."
          />
        </label>

        <label className="form-span-2">
          Próximo follow-up
          <input
            type="datetime-local"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
          />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar CRM"}
      </button>
    </form>
  );
}
