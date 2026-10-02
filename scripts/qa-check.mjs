import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function assert(condition, message) {
  if (!condition) {
    console.error("QA FAIL:", message);
    process.exitCode = 1;
  } else {
    console.log("QA OK:", message);
  }
}

const proPages = [
  "app/clientes/page.tsx",
  "app/clientes/[id]/page.tsx",
  "app/eventos/page.tsx",
  "app/eventos/[id]/page.tsx",
  "app/agenda/page.tsx",
  "app/equipe/page.tsx",
  "app/pacotes/page.tsx",
  "app/pacotes/[id]/page.tsx",
  "app/financeiro/page.tsx",
  "app/relatorios/page.tsx",
  "app/estoque/page.tsx",
  "app/fornecedores/page.tsx",
  "app/fornecedor/page.tsx",
  "app/configuracoes/page.tsx",
  "app/orcamentos/[id]/page.tsx",
];

for (const file of proPages) {
  assert(exists(file), file + " existe");
  const content = read(file);
  assert(content.includes("requirePro("), file + " exige plano Pro");
  assert(content.includes('redirect("/login")'), file + " exige autenticação");
}

assert(exists("proxy.ts"), "proxy de sessão SSR existe");
assert(exists("app/auth/callback/route.ts"), "callback de autenticação existe");
assert(exists("app/esqueci-senha/page.tsx"), "recuperação de senha existe");
assert(exists("app/nova-senha/page.tsx"), "troca de senha existe");

const proposal = read("app/proposta/[token]/page.tsx");
const contract = read("app/contrato/[token]/page.tsx");
assert(proposal.includes("index: false"), "propostas públicas não são indexadas");
assert(contract.includes("index: false"), "contratos públicos não são indexados");

const billing = read("app/api/billing/cakto/webhook/route.ts");
assert(billing.includes("body.secret"), "webhook Cakto lê segredo do payload");
assert(!billing.includes('searchParams.get("key")'), "webhook Cakto não usa segredo na URL");

const aiApi = read("app/api/ai/planner/route.ts");
assert(aiApi.includes("https://api.openai.com/v1/responses"), "IA Brasa usa OpenAI Responses API");
assert(aiApi.includes('process.env.OPENAI_API_KEY'), "chave OpenAI fica somente no servidor");
assert(!aiApi.includes("NEXT_PUBLIC_OPENAI"), "chave OpenAI não é exposta ao navegador");

const aiPage = read("app/ia-brasa/page.tsx");
assert(aiPage.includes("AIPlanner"), "central da IA Brasa está ativa");
assert(aiPage.includes("AIBusinessAdvisor"), "IA Brasa possui análise profissional contextual");

const advisorApi = read("app/api/ai/advisor/route.ts");
assert(advisorApi.includes("https://api.openai.com/v1/responses"), "advisor profissional usa OpenAI Responses API");
assert(advisorApi.includes("isActivePro"), "advisor profissional exige plano Pro");
assert(!advisorApi.includes("NEXT_PUBLIC_OPENAI"), "advisor não expõe chave OpenAI ao navegador");

assert(exists("app/suporte/page.tsx"), "central de suporte interno existe");
assert(exists("app/suporte/[id]/page.tsx"), "histórico de chamado existe");

const authForm = read("components/AuthForm.tsx");
assert(authForm.includes("isValidTaxId"), "cadastro profissional valida CPF/CNPJ");
assert(authForm.includes("Em breve"), "cadastro sinaliza fornecedor como em breve");

const envExample = read(".env.example");
assert(envExample.includes("MARKETPLACE_ENABLED=false"), "marketplace fica desativado no lançamento");
assert(!/sb_secret_[A-Za-z0-9_-]+/.test(envExample), ".env.example não contém chave secreta Supabase");
assert(!/service_role\s*=\s*[^<\s]/i.test(envExample), ".env.example não contém service role real");

if (process.exitCode) {
  console.error("\nQA estático encontrou bloqueadores.");
  process.exit(process.exitCode);
}

console.log("\nQA estático concluído sem bloqueadores.");
