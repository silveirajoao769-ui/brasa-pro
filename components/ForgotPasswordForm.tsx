"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);setMessage("");
    const email=String(new FormData(event.currentTarget).get("email")||"").trim().toLowerCase();
    if(!email){setMessage("Informe seu e-mail.");setLoading(false);return;}
    try {
      const db=createClient();
      const redirectTo=window.location.origin+"/auth/callback?next="+encodeURIComponent("/nova-senha");
      const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;
      setMessage("Se esse e-mail estiver cadastrado, enviaremos um link para recuperar a senha.");
    }catch{setMessage("Não foi possível enviar o link. Confira as configurações de autenticação e tente novamente.");}
    finally{setLoading(false);}
  }
  return <form className="aos-auth-form" onSubmit={submit}><label>E-mail da conta<input name="email" type="email" autoComplete="email" required placeholder="voce@email.com"/></label>{message&&<p className="aos-form-message" role="status">{message}</p>}<button type="submit" disabled={loading} className="aos-btn aos-btn-primary aos-auth-submit">{loading?"Enviando...":"Enviar link de recuperação →"}</button></form>;
}
