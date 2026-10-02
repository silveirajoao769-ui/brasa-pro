import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | Brasa Pro",
  description: "Política de privacidade da plataforma Brasa Pro.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="shell legal-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PRIVACIDADE</small></span>
        </Link>
        <Link href="/" className="ghost-button">Voltar</Link>
      </div>

      <article className="shell legal-document">
        <span className="eyebrow">PRIVACIDADE E DADOS</span>
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: 2 de outubro de 2026.</p>

        <section>
          <h2>1. Dados tratados</h2>
          <p>
            Podemos tratar dados fornecidos diretamente pelo usuário, como nome, e-mail,
            telefone, cidade, informações profissionais e dados necessários para autenticação.
            Usuários profissionais também podem cadastrar informações de clientes, eventos,
            equipe, fornecedores, propostas, cobranças e estoque.
          </p>
        </section>

        <section>
          <h2>2. Finalidades</h2>
          <p>
            Os dados são utilizados para criar e proteger contas, executar funcionalidades,
            salvar planejamentos, organizar operações profissionais, gerar documentos,
            processar permissões de plano, prestar suporte e manter a segurança da plataforma.
          </p>
        </section>

        <section>
          <h2>3. Pagamentos</h2>
          <p>
            A assinatura Pro é processada por um provedor de pagamento externo. O Brasa Pro
            recebe informações necessárias para identificar o status da assinatura, como
            evento de pagamento, e-mail de cobrança e identificadores técnicos. Os dados
            completos do cartão não são armazenados pelo Brasa Pro.
          </p>
        </section>

        <section>
          <h2>4. Infraestrutura e prestadores</h2>
          <p>
            A plataforma utiliza serviços de infraestrutura, banco de dados, autenticação,
            hospedagem e processamento de pagamentos. Esses prestadores podem tratar dados
            estritamente necessários para fornecer seus serviços e manter a operação técnica.
          </p>
        </section>

        <section>
          <h2>5. Dados de clientes cadastrados por profissionais</h2>
          <p>
            Quando um usuário profissional cadastra dados de seus próprios clientes, ele deve
            utilizar apenas informações necessárias à relação comercial e tratá-las de forma
            responsável. O Brasa Pro fornece a infraestrutura para armazenar e organizar esses
            registros dentro da conta autorizada.
          </p>
        </section>

        <section>
          <h2>6. Segurança</h2>
          <p>
            O Brasa Pro utiliza autenticação, controles de acesso por usuário, políticas no
            banco de dados e separação entre recursos Free e Pro. Nenhum sistema é totalmente
            imune a incidentes, por isso medidas técnicas e operacionais são revisadas
            periodicamente.
          </p>
        </section>

        <section>
          <h2>7. Links públicos de proposta e contrato</h2>
          <p>
            Propostas e contratos podem ser compartilhados por links únicos. Esses links devem
            ser tratados como confidenciais e enviados somente às pessoas envolvidas. As páginas
            públicas são configuradas para não serem indexadas por mecanismos de busca.
          </p>
        </section>

        <section>
          <h2>8. Retenção e exclusão</h2>
          <p>
            Dados podem ser mantidos enquanto a conta estiver ativa ou enquanto forem
            necessários para executar o serviço, cumprir obrigações, resolver disputas e
            preservar registros legítimos. Solicitações de correção ou exclusão podem ser
            encaminhadas pelo canal de suporte da plataforma.
          </p>
        </section>

        <section>
          <h2>9. Direitos e solicitações</h2>
          <p>
            O usuário pode solicitar informações sobre seus dados, correção de informações
            incorretas e, quando aplicável, exclusão ou outras providências previstas pela
            legislação. A análise da solicitação pode exigir confirmação de identidade.
          </p>
        </section>

        <section>
          <h2>10. Alterações desta política</h2>
          <p>
            Esta política pode ser atualizada para refletir mudanças no produto, fornecedores,
            requisitos legais ou práticas de segurança. A data de atualização será indicada no
            início do documento.
          </p>
        </section>

        <div className="legal-links">
          <Link href="/termos">Termos de Uso →</Link>
          <Link href="/">Voltar ao Brasa Pro</Link>
        </div>
      </article>
    </main>
  );
}
