"use client";

import { useState } from "react";

export default function ShareContractActions({
  publicToken,
  status,
}: {
  publicToken: string;
  status: string;
}) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    const url = window.location.origin + "/contrato/" + publicToken;
    await navigator.clipboard.writeText(url);
    setMessage("Link do contrato copiado.");
  }

  return (
    <div className="quote-share-actions">
      <button className="primary-button" type="button" onClick={copyLink}>
        Copiar link do contrato
      </button>
      <a
        className="ghost-button"
        href={"/contrato/" + publicToken}
        target="_blank"
        rel="noreferrer"
      >
        Abrir contrato público
      </a>
      <small>{status === "accepted" ? "Contrato aceito pelo cliente." : message}</small>
    </div>
  );
}
