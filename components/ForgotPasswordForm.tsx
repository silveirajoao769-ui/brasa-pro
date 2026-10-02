"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();

    if (!email) {
      setMessage("Informe seu e-mail.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectTo =
      window.location.origin + "/auth/callback?next=" + encodeURIComponent("/nova-senha");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage("Não foi possível enviar o link agora. Tente novamente.");
      setLoading(false);
      return;
    }

    setMessage("Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        E-mail da conta
        <input name="email" type="email" autoComplete="email" placeholder="voce@email.com" />
      </label>

      {message && <div className="auth-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Enviando..." : "Enviar link de recuperação →"}
      </button>
    </form>
  );
}
