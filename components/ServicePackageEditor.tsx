"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ServicePackageEditor({
  packageData,
}: {
  packageData: {
    id: string;
    name: string;
    description: string;
    price_per_person: number | string;
    min_guests: number;
    active: boolean;
    notes: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const price = Number(form.get("pricePerPerson") || 0);

    if (!name || price <= 0) {
      setMessage("Informe nome e valor por pessoa.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("service_packages")
      .update({
        name,
        description: String(form.get("description") || "").trim(),
        price_per_person: price,
        min_guests: Math.max(1, Number(form.get("minGuests") || 1)),
        active: String(form.get("active") || "true") === "true",
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageData.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Pacote atualizado.");
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="inline-editor">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar edição" : "Editar pacote"}
      </button>
      {open && (
        <form className="workspace-form inline-editor-form" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label className="form-span-2">
              Nome
              <input name="name" defaultValue={packageData.name} />
            </label>
            <label>
              Preço por pessoa
              <input name="pricePerPerson" type="number" min={0.01} step="0.01" defaultValue={Number(packageData.price_per_person)} />
            </label>
            <label>
              Mínimo de convidados
              <input name="minGuests" type="number" min={1} defaultValue={packageData.min_guests} />
            </label>
            <label>
              Status
              <select name="active" defaultValue={String(packageData.active)}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </label>
            <label className="form-span-2">
              Descrição
              <textarea name="description" rows={3} defaultValue={packageData.description || ""} />
            </label>
            <label className="form-span-2">
              Observações
              <textarea name="notes" rows={2} defaultValue={packageData.notes || ""} />
            </label>
          </div>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar pacote"}
          </button>
        </form>
      )}
    </div>
  );
}
