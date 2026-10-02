"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function SupplierEditor({
  supplier,
}: {
  supplier: {
    id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    active: boolean;
    notes?: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    await supabase.from("suppliers").update({
      name: String(form.get("name") || "").trim(),
      contact_name: String(form.get("contactName") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
      state: String(form.get("state") || "").trim().toUpperCase() || null,
      notes: String(form.get("notes") || "").trim(),
      active: String(form.get("active") || "true") === "true",
      updated_at: new Date().toISOString(),
    }).eq("id", supplier.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="suppliers"
        id={supplier.id}
        confirmText={"Excluir " + supplier.name + "? Os preços cadastrados para este fornecedor também serão removidos."}
      />
      {open && (
        <form className="workspace-form inline-row-editor supplier-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Fornecedor</span><input name="name" defaultValue={supplier.name} /></label>
            <label><span>Contato</span><input name="contactName" defaultValue={supplier.contact_name || ""} /></label>
            <label><span>Telefone</span><input name="phone" defaultValue={supplier.phone || ""} /></label>
            <label><span>E-mail</span><input name="email" type="email" defaultValue={supplier.email || ""} /></label>
            <label><span>Cidade</span><input name="city" defaultValue={supplier.city || ""} /></label>
            <label><span>Estado</span><input name="state" maxLength={2} defaultValue={supplier.state || ""} /></label>
            <label>
              <span>Status</span>
              <select name="active" defaultValue={String(supplier.active)}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </label>
            <label className="form-span-2"><span>Observações</span><input name="notes" defaultValue={supplier.notes || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar fornecedor"}
          </button>
        </form>
      )}
    </div>
  );
}
