import Link from "next/link";
import AccessForm from "@/components/affiliate/AccessForm";

export default function Login() {
  return <main className="aos-root aos-auth-page"><div className="aos-auth-wrap"><Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link><div className="aos-auth-panel"><span className="aos-overline">BEM-VINDO DE VOLTA</span><h1>Entre na sua<br/><em>operação.</em></h1><p>Continue executando e acompanhando o que importa.</p><AccessForm mode="login"/></div></div></main>;
}
