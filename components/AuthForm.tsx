"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTaxId, isValidTaxId } from "@/lib/br-tax-id";

type AuthFormProps = {
  mode: "login" | "signup";
};

function FieldIcon({ kind }: { kind: "user" | "mail" | "lock" }) {
  if (kind === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (kind === "lock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.8-4.3 3.2-6.5 7.5-6.5s6.7 2.2 7.5 6.5" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="M4 4 20 20" />}
    </svg>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [accountType, setAccountType] = useState("consumer");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [taxId, setTaxId] = useState("");

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = password.length >= 8 ? 1 : 0;
    if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 3);
  }, [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const formPassword = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();

    if (!email || !formPassword || (mode === "signup" && !fullName)) {
      setMessage("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && formPassword.length < 8) {
      setMessage("Use uma senha com pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && accountType === "professional" && !isValidTaxId(taxId)) {
      setMessage("Informe um CPF ou CNPJ válido para criar uma conta profissional.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const emailRedirectTo =
        window.location.origin + "/auth/callback?next=" + encodeURIComponent("/dashboard");

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formPassword,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
            account_type: accountType,
            tax_id: accountType === "professional" ? taxId : null,
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

        setMessage(
          repeatedSignup
            ? "Esse e-mail já pode ter sido cadastrado. Entre na conta ou use a recuperação de senha."
            : "Cadastro recebido. Confira sua caixa de entrada e o spam para confirmar o e-mail."
        );

        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formPassword,
      });

      if (error) {
        setMessage("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (mode === "signup") {
    return (
      <form className="signup-auth-form" onSubmit={handleSubmit}>
        <fieldset className="signup-persona-fieldset">
          <legend>Como você vai usar o Brasa Pro?</legend>
          <div className="signup-persona-options">
            <button
              type="button"
              className={accountType === "professional" ? "signup-persona-option active" : "signup-persona-option"}
              onClick={() => setAccountType("professional")}
            >
              <span className="persona-mini-icon">♨</span>
              <b>Trabalho com churrasco</b>
              <small>Eventos e gestão profissional</small>
            </button>

            <button
              type="button"
              className={accountType === "consumer" ? "signup-persona-option active" : "signup-persona-option"}
              onClick={() => setAccountType("consumer")}
            >
              <span className="persona-mini-icon">◎</span>
              <b>Uso pessoal</b>
              <small>Amigos, família e eventos</small>
            </button>

            <button
              type="button"
              className="signup-persona-option coming-soon"
              disabled
              aria-disabled="true"
            >
              <span className="persona-mini-icon">▣</span>
              <b>Sou fornecedor</b>
              <small>Em breve</small>
            </button>
          </div>
        </fieldset>

        <label className="signup-field">
          <span>Seu nome</span>
          <div className="signup-input-wrap">
            <i><FieldIcon kind="user" /></i>
            <input
              name="fullName"
              type="text"
              placeholder="Como devemos te chamar?"
              autoComplete="name"
            />
          </div>
        </label>

        <label className="signup-field">
          <span>E-mail</span>
          <div className="signup-input-wrap">
            <i><FieldIcon kind="mail" /></i>
            <input
              name="email"
              type="email"
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </div>
        </label>

        {accountType === "professional" && (
          <label className="signup-field">
            <span>CPF ou CNPJ</span>
            <div className="signup-input-wrap">
              <i><FieldIcon kind="user" /></i>
              <input
                name="taxId"
                type="text"
                inputMode="numeric"
                value={taxId}
                onChange={(event) => setTaxId(formatTaxId(event.target.value))}
                placeholder="Obrigatório para conta profissional"
                autoComplete="off"
              />
            </div>
          </label>
        )}

        <label className="signup-field">
          <span>Senha</span>
          <div className="signup-input-wrap">
            <i><FieldIcon kind="lock" /></i>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              minLength={8}
              autoComplete="new-password"
            />
            <button
              className="signup-password-toggle"
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(!showPassword)}
            >
              <EyeIcon hidden={!showPassword} />
            </button>
          </div>
          {password && (
            <span className="signup-password-strength">
              <i className={passwordStrength >= 1 ? "active" : ""} />
              <i className={passwordStrength >= 2 ? "active" : ""} />
              <i className={passwordStrength >= 3 ? "active" : ""} />
              <small>{passwordStrength >= 3 ? "Senha forte" : passwordStrength === 2 ? "Senha boa" : "Senha fraca"}</small>
            </span>
          )}
        </label>

        {message && <div className="auth-message signup-auth-message">{message}</div>}

        <button className="signup-submit" disabled={loading} type="submit">
          <span>{loading ? "Aguarde..." : "Criar minha conta"}</span>
          <b>→</b>
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        E-mail
        <input name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
      </label>

      <label>
        Senha
        <input
          name="password"
          type="password"
          placeholder="Sua senha"
          minLength={6}
          autoComplete="current-password"
        />
      </label>

      {message && <div className="auth-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Aguarde..." : "Entrar →"}
      </button>
    </form>
  );
}
