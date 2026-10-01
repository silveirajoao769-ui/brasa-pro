"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [accountType, setAccountType] = useState("consumer");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();

    if (!email || !password || (mode === "signup" && !fullName)) {
      setMessage("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: accountType,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setMessage("Cadastro criado. Confira seu e-mail para confirmar a conta.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "signup" && (
        <>
          <label>
            Seu nome
            <input name="fullName" type="text" placeholder="Como devemos te chamar?" autoComplete="name" />
          </label>

          <label>
            Como você vai usar o Brasa Pro?
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="consumer">Vou fazer churrascos</option>
              <option value="professional">Trabalho com churrasco</option>
              <option value="supplier">Sou açougue / fornecedor</option>
            </select>
          </label>
        </>
      )}

      <label>
        E-mail
        <input name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
      </label>

      <label>
        Senha
        <input
          name="password"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>

      {message && <div className="auth-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading
          ? "Aguarde..."
          : mode === "signup"
            ? "Criar minha conta →"
            : "Entrar →"}
      </button>
    </form>
  );
}
