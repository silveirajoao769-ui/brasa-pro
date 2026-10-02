"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password.length < 8) {
      setMessage("Use uma senha com pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As duas senhas precisam ser iguais.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("Não foi possível atualizar a senha. Solicite um novo link.");
      setLoading(false);
      return;
    }

    setMessage("Senha atualizada com sucesso.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Nova senha
        <input
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
        />
      </label>

      <label>
        Confirmar nova senha
        <input
          name="confirmPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="Digite novamente"
        />
      </label>

      {message && <div className="auth-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Atualizando..." : "Salvar nova senha →"}
      </button>
    </form>
  );
}
