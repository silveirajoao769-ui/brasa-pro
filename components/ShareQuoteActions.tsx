"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ShareQuoteActions({
  quoteId,
  publicToken,
  status,
}: {
  quoteId: string;
  publicToken: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function publishQuote() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("quotes")
      .update({ status: "sent" })
      .eq("id", quoteId);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Proposta liberada para o cliente.");
    setLoading(false);
    router.refresh();
  }

  async function copyLink() {
    const url = window.location.origin + "/proposta/" + publicToken;
    await navigator.clipboard.writeText(url);
    setMessage("Link copiado.");
  }

  return (
    <div className="quote-share-actions">
      {status === "draft" ? (
        <button className="primary-button" type="button" onClick={publishQuote} disabled={loading}>
          {loading ? "Liberando..." : "Liberar proposta para o cliente"}
        </button>
      ) : (
        <button className="primary-button" type="button" onClick={copyLink}>
          Copiar link da proposta
        </button>
      )}

      {status !== "draft" && (
        <a className="ghost-button" href={"/proposta/" + publicToken} target="_blank" rel="noreferrer">
          Abrir proposta pública
        </a>
      )}

      {message && <small>{message}</small>}
    </div>
  );
}
