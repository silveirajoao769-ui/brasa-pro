import Link from "next/link";
import AccessForm from "@/components/affiliate/AccessForm";

export default function Register() {
  return <main className="aos-root aos-auth-page"><div className="aos-auth-wrap"><Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><div className="aos-auth-panel"><span className="aos-overline">COMECE POR AQUI</span><h1>Uma conta.<br/><em>Mais execução.</em></h1><p>Crie seu espaço como afiliado ou mentor.</p><AccessForm mode="signup"/><p className="aos-helper" style={{marginTop:20,textAlign:"center"}}>Versão experimental. Leia as <Link href="/termos" style={{color:"var(--aos-primary)"}}>condições do piloto</Link> e as <Link href="/privacidade" style={{color:"var(--aos-primary)"}}>informações de privacidade</Link>.</p></div></div></main>;
}
