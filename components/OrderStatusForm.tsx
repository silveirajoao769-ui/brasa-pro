"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const options = [
  ["pending", "Pendente"],
  ["accepted", "Aceito"],
  ["preparing", "Em preparo"],
  ["ready", "Pronto"],
  ["completed", "Concluído"],
  ["cancelled", "Cancelado"],
];

export default function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("partner_orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Status atualizado.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="order-status-editor">
      <label>
        Status do pedido
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {options.map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
      </label>

      <button className="primary-button" type="button" disabled={loading} onClick={save}>
        {loading ? "Salvando..." : "Atualizar status"}
      </button>

      {message && <small>{message}</small>}
    </div>
  );
}
