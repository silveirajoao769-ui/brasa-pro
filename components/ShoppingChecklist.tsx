"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  estimated_price: number | null;
};

function money(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ShoppingChecklist({ items }: { items: Item[] }) {
  const [localItems, setLocalItems] = useState(items);
  const completed = localItems.filter((item) => item.checked).length;

  async function toggle(id: string) {
    const item = localItems.find((entry) => entry.id === id);
    if (!item) return;

    const nextValue = !item.checked;

    setLocalItems((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, checked: nextValue } : entry,
      ),
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("shopping_list_items")
      .update({ checked: nextValue })
      .eq("id", id);

    if (error) {
      setLocalItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, checked: item.checked } : entry,
        ),
      );
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="empty-state">
        <span>🛒</span>
        <b>Lista ainda vazia</b>
        <p>Crie um novo planejamento para gerar os itens automaticamente.</p>
      </div>
    );
  }

  return (
    <>
      <div className="shopping-progress">
        <div>
          <span>Progresso</span>
          <b>{completed}/{localItems.length} comprados</b>
        </div>
        <div className="shopping-progress-track">
          <span style={{ width: ((completed / localItems.length) * 100) + "%" }} />
        </div>
      </div>

      <div className="shopping-preview">
        {localItems.map((item) => (
          <button
            className={item.checked ? "shopping-preview-row checked-row" : "shopping-preview-row"}
            key={item.id}
            onClick={() => toggle(item.id)}
            type="button"
          >
            <span className={item.checked ? "check-box checked" : "check-box"}>
              {item.checked ? "✓" : ""}
            </span>
            <div>
              <b>{item.name}</b>
              <small>{item.category} · {money(item.estimated_price)}</small>
            </div>
            <strong>{Number(item.quantity).toLocaleString("pt-BR")} {item.unit}</strong>
          </button>
        ))}
      </div>
    </>
  );
}
