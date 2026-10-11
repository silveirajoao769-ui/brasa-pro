import Link from "next/link";
import {redirect} from "next/navigation";
import NewPasswordForm from "@/components/NewPasswordForm";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function NewPasswordPage(){
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)redirect("/esqueci-senha");
  return <main className="aos-root aos-auth-page"><div className="aos-auth-wrap"><Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><section className="aos-auth-panel"><span className="aos-overline">ACESSO SEGURO</span><h1>Crie sua nova<br/><em>senha.</em></h1><p>Use pelo menos oito caracteres.</p><NewPasswordForm/></section></div></main>;
}
