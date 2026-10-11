"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
type Persona = "affiliate" | "mentor";

export default function AccessForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [persona, setPersona] = useState<Persona>("affiliate");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim();
    const destination = persona === "mentor" ? "/mentor" : "/afiliado";
    if (!email || password.length < 8 || (mode === "signup" && !name)) {
      setMessage("Preencha os campos e use uma senha com pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data: result, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback?next=" + encodeURIComponent(destination),
            data: { full_name: name, aos_preference: persona }, // Preferência visual, nunca usada para autorizar permissões.
          },
        });
        if (error) throw error;
        if (!result.session || !result.user) {
          setMessage("Cadastro enviado. Confira seu e-mail para confirmar a conta antes de entrar.");
          return;
        }
        const { error: profileError } = await supabase.from("aos_profiles").upsert({
          user_id: result.user.id, display_name: name, preference: persona,
        }, { onConflict: "user_id" });
        if (profileError) {
          setMessage("Conta criada, mas o painel ainda está sendo configurado. Tente entrar novamente.");
          return;
        }
      } else {
        const { data: result, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !result.user) {
          setMessage("Não foi possível entrar. Verifique e-mail, senha e confirmação da conta.");
          return;
        }
        const { data: profile } = await supabase.from("aos_profiles").select("preference").eq("user_id", result.user.id).maybeSingle();
        const preferred = profile?.preference === "mentor" || (!profile && result.user.user_metadata?.aos_preference === "mentor");
        router.push(preferred ? "/mentor" : "/afiliado");
        router.refresh();
        return;
      }
      router.push(destination);
      router.refresh();
    } catch {
      setMessage("Não foi possível completar a operação. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="aos-auth-form" onSubmit={onSubmit}>
      {mode === "signup" && <label>Seu nome<input name="name" autoComplete="name" required maxLength={90} placeholder="Como podemos chamar você?" /></label>}
      <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="voce@email.com" /></label>
      <label>Senha<input name="password" type="password" minLength={8} required autoComplete={mode==="signup"?"new-password":"current-password"} placeholder="Mínimo de 8 caracteres" /></label>
      {mode === "signup" && <fieldset className="aos-role-options"><legend>Quero usar como</legend><div><label className={persona==="affiliate"?"selected":""}><input name="persona" type="radio" value="affiliate" checked={persona==="affiliate"} onChange={()=>setPersona("affiliate")}/><span><b>↗ Afiliado</b><small>Organizar minhas campanhas</small></span></label><label className={persona==="mentor"?"selected":""}><input name="persona" type="radio" value="mentor" checked={persona==="mentor"} onChange={()=>setPersona("mentor")}/><span><b>◇ Mentor</b><small>Acompanhar meus alunos</small></span></label></div></fieldset>}
      {message && <p role="status" className="aos-form-message">{message}</p>}
      <button type="submit" disabled={loading} className="aos-btn aos-btn-primary aos-auth-submit">{loading?"Processando...":mode==="signup"?"Criar conta gratuita →":"Entrar na plataforma →"}</button>
      {mode==="login"&&<p className="aos-auth-help"><Link href="/esqueci-senha">Esqueci minha senha</Link></p>}
      <div className="aos-auth-footer">{mode==="signup"?<>Já tem uma conta? <Link href="/acesso">Entrar</Link></>:<>Ainda não tem uma conta? <Link href="/criar-conta">Cadastrar</Link></>}</div>
    </form>
  );
}
