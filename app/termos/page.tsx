import Link from "next/link";

export const metadata = {
  title: "Termos de Uso | Brasa Pro",
  description: "Termos de uso da plataforma Brasa Pro.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="shell legal-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>TERMOS DE USO</small></span>
        </Link>
        <Link href="/" className="ghost-button">Voltar</Link>
      </div>

      <article className="shell legal-document">
        <span className="eyebrow">DOCUMENTO DA PLATAFORMA</span>
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: 2 de outubro de 2026.</p>

        <section>
          <h2>1. Sobre o Brasa Pro</h2>
          <p>
            O Brasa Pro é uma plataforma de apoio ao planejamento de churrascos e à gestão
            de operações profissionais, incluindo recursos como cálculo de quantidades,
            listas de compras, clientes, eventos, propostas, contratos, agenda, equipe,
            cobranças, estoque, fornecedores e relatórios.
          </p>
        </section>

        <section>
          <h2>2. Conta e acesso</h2>
          <p>
            Para usar recursos que exigem conta, o usuário deve fornecer informações corretas
            e manter suas credenciais em segurança. A conta é individual e o usuário é
            responsável pelas ações realizadas após autenticação.
          </p>
        </section>

        <section>
          <h2>3. Plano Free e plano Pro</h2>
          <p>
            O plano Free disponibiliza recursos básicos sem cobrança recorrente. O plano Pro
            libera recursos profissionais mediante assinatura. Preço, periodicidade e
            condições aplicáveis são exibidos na tela de planos antes da contratação.
          </p>
          <p>
            Pagamentos são processados por provedor externo. O Brasa Pro não armazena os
            dados completos do cartão utilizado no checkout.
          </p>
        </section>

        <section>
          <h2>4. Cancelamento, reembolso e chargeback</h2>
          <p>
            O cancelamento da renovação segue as condições apresentadas no checkout e pelo
            provedor de pagamento. Quando houver período já pago ainda vigente, o acesso pode
            permanecer disponível até seu término. Reembolsos e chargebacks podem encerrar o
            acesso aos recursos pagos.
          </p>
        </section>

        <section>
          <h2>5. Cálculos, preços e estimativas</h2>
          <p>
            Quantidades, custos, margens, preços de ingredientes e demais cálculos exibidos
            pela plataforma são ferramentas de apoio. Valores de mercado podem variar por
            região, fornecedor, data, marca e condições de compra. O usuário deve revisar os
            números antes de assumir compromissos comerciais.
          </p>
        </section>

        <section>
          <h2>6. Propostas e contratos</h2>
          <p>
            Usuários profissionais podem gerar propostas e contratos digitais. O conteúdo
            comercial inserido pelo usuário é de sua responsabilidade. O Brasa Pro registra
            aprovações e aceites para organização operacional, mas não substitui orientação
            jurídica específica quando ela for necessária.
          </p>
        </section>

        <section>
          <h2>7. Marketplace e fornecedores</h2>
          <p>
            Quando a plataforma exibir fornecedores, produtos ou pedidos de terceiros, cada
            fornecedor é responsável pelas informações, preços, disponibilidade, qualidade,
            entrega e atendimento relacionados aos próprios produtos e serviços.
          </p>
        </section>

        <section>
          <h2>8. Uso adequado</h2>
          <p>
            Não é permitido usar a plataforma para fraude, tentativa de acesso não autorizado,
            distribuição de malware, violação de direitos de terceiros ou qualquer atividade
            ilícita. Contas utilizadas de forma abusiva podem ter o acesso limitado ou suspenso.
          </p>
        </section>

        <section>
          <h2>9. Disponibilidade e alterações</h2>
          <p>
            O serviço pode receber atualizações, correções, mudanças de interface e evolução
            de funcionalidades. Interrupções temporárias podem ocorrer por manutenção,
            fornecedores de infraestrutura ou eventos fora do controle da plataforma.
          </p>
        </section>

        <section>
          <h2>10. Contato</h2>
          <p>
            Solicitações relacionadas à conta, cobrança, privacidade ou uso da plataforma
            devem ser enviadas pelo canal de suporte informado dentro do Brasa Pro.
          </p>
        </section>

        <div className="legal-links">
          <Link href="/privacidade">Política de Privacidade →</Link>
          <Link href="/">Voltar ao Brasa Pro</Link>
        </div>
      </article>
    </main>
  );
}
