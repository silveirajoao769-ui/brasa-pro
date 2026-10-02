"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function TeamMemberEditor({
  member,
}: {
  member: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    default_role: string;
    default_daily_rate: number | string;
    active: boolean;
    notes: string;
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

    await supabase
      .from("team_members")
      .update({
        name: String(form.get("name") || "").trim(),
        phone: String(form.get("phone") || "").trim() || null,
        email: String(form.get("email") || "").trim() || null,
        default_role: String(form.get("role") || "Auxiliar").trim(),
        default_daily_rate: Math.max(0, Number(form.get("rate") || 0)),
        active: String(form.get("active") || "true") === "true",
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

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
        table="team_members"
        id={member.id}
        confirmText={"Excluir " + member.name + "? As escalas ligadas a ele também serão removidas."}
      />
      {open && (
        <form className="workspace-form inline-row-editor team-row-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Nome</span><input name="name" defaultValue={member.name} /></label>
            <label><span>Função</span><input name="role" defaultValue={member.default_role} /></label>
            <label><span>Diária</span><input name="rate" type="number" min={0} step="0.01" defaultValue={Number(member.default_daily_rate)} /></label>
            <label>
              <span>Status</span>
              <select name="active" defaultValue={String(member.active)}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </label>
            <label><span>Telefone</span><input name="phone" defaultValue={member.phone || ""} /></label>
            <label><span>E-mail</span><input name="email" defaultValue={member.email || ""} /></label>
            <label className="form-span-2"><span>Observações</span><input name="notes" defaultValue={member.notes || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar profissional"}
          </button>
        </form>
      )}
    </div>
  );
}
