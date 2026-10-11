# Afiliado OS — migração controlada do Brasa Pro

## Repositório e segurança
- Origem: silveirajoao769-ui/brasa-pro.
- Backup original: branch backup/brasa-pro-2026-10-11.
- Trabalho isolado: branch feature/afiliado-os-mvp.
- NÃO aplicar a migração no banco de produção Brasa Pro nem mesclar no main antes da homologação.
- O Supabase conectado nesta sessão não lista brasa-pro; não confundir com o antigo projeto ZAP OfertasPro.

## Reaproveitamento e recursos
- Next.js e estrutura App Router; Supabase Auth, cliente/servidor e proxy de sessão.
- GitHub e integração Vercel existente.
- CSS original mantido para rollback.
- Nova landing page /, cadastro /criar-conta e acesso /acesso.
- /afiliado: campanhas, links, despesas, comissões e tarefas.
- /mentor: turmas, convite, solicitações, aprovação, tarefas e progresso.
- SQL isolado sql/afiliado_os_mvp.sql com sete tabelas novas com prefixo aos_, políticas RLS e privilégios explícitos.

## Passos obrigatórios antes de lançar
1. Identificar a instância correta de Supabase e criar BANCO DE HOMOLOGAÇÃO separado. Associar a prévia da Vercel a ele usando variáveis de ambiente Preview.
2. Executar sql/afiliado_os_mvp.sql apenas no ambiente de homologação. Conferir os GRANTs, RLS e índices, inclusive as restrições por usuário.
3. Configurar autenticação por e-mail e URLs permitidas de callback/preview.
4. Fazer testes com três contas distintas (mentor A, aluno A e aluno B) e verificar isolamento de dados, alteração de tarefas e pedidos de acesso com código errado.
5. Corrigir eventuais problemas de responsividade e de confirmação de e-mail.
6. Criar as assinaturas Afiliado OS na Cakto e novo fluxo de cobrança compatível. O checkout, o webhook e as assinaturas legadas Brasa Pro NÃO podem conceder acesso ao novo SaaS.
7. Reescrever termos, privacidade e suporte. Bloquear/remover rotas de churrasco na versão final.
8. Conferir CI e prévia. Só depois liberar produção, validar e ativar SEO.

## Cenários de homologação
- [ ] Cadastrar e confirmar um e-mail como afiliado.
- [ ] Registrar campanhas sem aceitar URLs perigosas ou inválidas.
- [ ] Lançar comissões pendentes e recebidas na própria campanha.
- [ ] Mostrar saldo baseado em comissões recebidas menos despesas cadastradas.
- [ ] Mentor cria turma e código de convite UUID.
- [ ] Aluno solicita vínculo; mentor aprova, envia tarefa.
- [ ] Aluno conclui tarefa; mentor acompanha.
- [ ] Um usuário não consegue ver/editar campanhas e comissões de outro.
- [ ] Mentor de outra turma não consegue aprovar pedidos nem tarefas indevidas.
- [ ] Aluno não consegue alterar título ou dono de uma tarefa.
- [ ] Main e dados legados Brasa Pro permanecem inalterados.

## Limites da primeira versão
- Sem IA, mineração de produtos nem automação de WhatsApp.
- Sem sincronização automática de vendas/comissões com plataformas.
- Nenhum plano pago nem checkout antigo habilitado no novo SaaS.
- Sem fiscalização de número máximo de alunos por plano até implementar cobrança.
- Dados financeiros autodeclarados pelos usuários; não são extratos auditados.
- Antes de divulgação, implementar rate limiting, mensagens de erro adequadas e revisar LGPD.

## Qualidade
CI existente: npm run qa e npm run build em pull requests para main. Não mesclar até CI verde.
