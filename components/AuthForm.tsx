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

    if (mode === "signup" && password.length < 8) {
      setMessage("Use uma senha com pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const emailRedirectTo =
        window.location.origin + "/auth/callback?next=" + encodeURIComponent("/dashboard");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
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
        const repeatedSignup = (data.user?.identities?.length || 0) === 0;

        if (repeatedSignup) {
          setMessage(
            "Esse e-mail já pode ter sido cadastrado antes. Toque em Entrar; se não lembrar a senha, use Esqueci minha senha."
          );
        } else {
          setMessage(
            "Cadastro recebido. Confira sua caixa de entrada e o spam para confirmar o e-mail."
          );
        }

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
    <form className={mode === "signup" ? "auth-form signup-reference-form" : "auth-form"} onSubmit={handleSubmit}>
      {mode === "signup" && (
        <>
          <label className="signup-field">
            <span className="signup-field-label">Seu nome</span>
            <div className="signup-input-shell">
              <span className="signup-field-icon">○</span>
              <input name="fullName" type="text" placeholder="Como devemos te chamar?" autoComplete="name" />
            </div>
          </label>

          <label className="signup-field">
            <span className="signup-field-label">Como você vai usar o Brasa Pro?</span>
            <div className="signup-input-shell signup-select-shell">
              <span className="signup-field-icon">♨</span>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="consumer">Vou fazer churrascos</option>
                <option value="professional">Trabalho com churrasco</option>
                <option value="supplier">Sou açougue / fornecedor</option>
              </select>
            </div>
          </label>
        </>
      )}

      <label className={mode === "signup" ? "signup-field" : undefined}>
        {mode === "signup" ? <span className="signup-field-label">E-mail</span> : "E-mail"}
        {mode === "signup" ? (
          <div className="signup-input-shell">
            <span className="signup-field-icon">✉</span>
            <input name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
          </div>
        ) : (
          <input name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
        )}
      </label>

      <label className={mode === "signup" ? "signup-field" : undefined}>
        {mode === "signup" ? <span className="signup-field-label">Senha</span> : "Senha"}
        {mode === "signup" ? (
          <div className="signup-input-shell">
            <span className="signup-field-icon">▣</span>
            <input
              name="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        ) : (
          <input
            name="password"
            type="password"
            placeholder="Sua senha"
            minLength={6}
            autoComplete="current-password"
          />
        )}
      </label>

      {message && <div className="auth-message">{message}</div>}

      <button className={mode === "signup" ? "primary-button wide signup-reference-submit" : "primary-button wide"} disabled={loading} type="submit">
        {loading
          ? "Aguarde..."
          : mode === "signup"
            ? "Criar minha conta →"
            : "Entrar →"}
      </button>
    </form>
  );
}
