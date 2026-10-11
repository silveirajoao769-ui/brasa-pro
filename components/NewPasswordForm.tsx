"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPasswordForm() {
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const data=new FormData(event.currentTarget);
    const password=String(data.get("password")||"");
    const repeat=String(data.get("repeat")||"");
    if(password.length<8 || password!==repeat){setMessage("A senha deve ter ao menos 8 caracteres, e os dois campos precisam ser iguais.");setLoading(false);return;}
    try{
      const db=createClient();
      const {error}=await db.auth.updateUser({password});
      if(error)throw error;
      router.push("/afiliado");
      router.refresh();
    }catch{setMessage("Não foi possível atualizar a senha. Solicite outro link.");}
    finally{setLoading(false);}
  }
  return <form className="aos-auth-form" onSubmit={submit}><label>Nova senha<input name="password" minLength={8} required type="password" autoComplete="new-password"/></label><label>Confirme a nova senha<input name="repeat" minLength={8} required type="password" autoComplete="new-password"/></label>{message&&<p className="aos-form-message" role="status">{message}</p>}<button className="aos-btn aos-btn-primary aos-auth-submit" type="submit" disabled={loading}>{loading?"Atualizando...":"Salvar nova senha →"}</button></form>;
}
