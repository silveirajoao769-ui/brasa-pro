import Link from "next/link";

export const metadata={title:"Condições do piloto | Afiliado OS",robots:{index:false,follow:false}};
export default function Terms(){
  return <main className="aos-root aos-auth-page"><article className="aos-auth-wrap" style={{width:"min(800px,100%)"}}>
    <Link href="/" className="aos-logo"><span className="aos-logo-mark">A<span>↗</span></span><span>afiliado<span className="aos-logo-accent">OS</span><small>OPERATING SYSTEM</small></span></Link>
    <section className="aos-auth-panel" style={{marginTop:25}}>
      <span className="aos-overline">FASE DE HOMOLOGAÇÃO</span>
      <h1>Condições de <em>teste.</em></h1>
      <p>Documento informativo provisório. Antes do lançamento público, os termos completos deverão ser revisados e disponibilizados com identificação e contato do responsável pelo serviço.</p>
      <h2>Objetivo</h2><p>O Afiliado OS está sendo desenvolvido como ferramenta de organização de campanhas, comissões registradas manualmente e acompanhamento de tarefas de mentoria.</p>
      <h2>Sem oferta comercial</h2><p>Esta prévia não oferece assinaturas pagas nem promete resultados de faturamento. As integrações automáticas com marketplaces não estão disponíveis.</p>
      <h2>Dados de teste</h2><p>Não use dados sensíveis, de clientes reais ou informações financeiras confidenciais durante a homologação. A base de testes poderá ser reinicializada antes da abertura comercial.</p>
      <h2>Próximas definições</h2><p>O processo de cobrança, cancelamento, suporte, identificação do responsável, retenção de dados e políticas finais ainda precisam ser definidos antes de oferecer o serviço ao público.</p>
      <div className="aos-auth-footer"><Link href="/privacidade">Informações de privacidade</Link> · <Link href="/">Página inicial</Link></div>
    </section></article></main>;
}
