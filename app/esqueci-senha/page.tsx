import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage(){
  return <main className="aos-root aos-auth-page"><div className="aos-auth-wrap"><Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><section className="aos-auth-panel"><span className="aos-overline">RECUPERAR ACESSO</span><h1>Volte para sua<br/><em>operação.</em></h1><p>Vamos enviar um link para recuperar sua senha.</p><ForgotPasswordForm/><div className="aos-auth-footer">Lembrou a senha? <Link href="/acesso">Entrar</Link></div></section></div></main>;
}
