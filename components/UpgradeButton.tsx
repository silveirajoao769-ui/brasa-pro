"use client";

import { useState } from "react";

export default function UpgradeButton({
  checkoutUrl,
  accountEmail,
}: {
  checkoutUrl: string | null;
  accountEmail: string;
}) {
  const [message, setMessage] = useState("");

  function upgrade() {
    setMessage("");

    if (!checkoutUrl) {
      setMessage("O checkout da Cakto ainda está sendo configurado.");
      return;
    }

    window.location.href = checkoutUrl;
  }

  return (
    <div className="upgrade-action">
      <button className="primary-button wide" type="button" onClick={upgrade}>
        Assinar Brasa Pro →
      </button>

      <small>
        Use na Cakto o mesmo e-mail da sua conta Brasa Pro: <b>{accountEmail}</b>
      </small>

      {message && <small>{message}</small>}
    </div>
  );
}
