"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TeamMemberForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const email = String(form.get("email") || "").trim();
    const defaultRole = String(form.get("defaultRole") || "Auxiliar").trim();
    const defaultDailyRate = Number(form.get("defaultDailyRate") || 0);
    const notes = String(form.get("notes") || "").trim();

    if (!name) {
      setMessage("Informe o nome do profissional.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("team_members").insert({
      user_id: user.id,
      name,
      phone: phone || null,
      email: email || null,
      default_role: defaultRole || "Auxiliar",
      default_daily_rate: Math.max(0, defaultDailyRate),
      notes,
      active: true,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Profissional adicionado à equipe.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form team-member-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Nome
          <input name="name" placeholder="Ex.: Rafael Souza" />
        </label>

        <label>
          Função padrão
          <select name="defaultRole" defaultValue="Auxiliar">
            <option>Churrasqueiro</option>
            <option>Auxiliar</option>
            <option>Garçom</option>
            <option>Cozinheiro</option>
            <option>Assador</option>
            <option>Motorista</option>
            <option>Coordenador</option>
            <option>Outro</option>
          </select>
        </label>

        <label>
          Diária padrão
          <input name="defaultDailyRate" min={0} step="0.01" type="number" placeholder="250" />
        </label>

        <label>
          Telefone
          <input name="phone" placeholder="(48) 99999-9999" />
        </label>

        <label>
          E-mail
          <input name="email" type="email" placeholder="profissional@email.com" />
        </label>

        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={2} placeholder="Disponibilidade, especialidades, observações..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "+ Adicionar profissional"}
      </button>
    </form>
  );
}
