import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Legacy Brasa pages remain in Git history for safe rollback,
// but should not be exposed as working Afiliado OS features.
const legacySegments = new Set([
  "agenda","churrascos","clientes","compras","configuracoes","contrato",
  "equipe","estoque","eventos","financeiro","fornecedor","fornecedores",
  "ia-brasa","orcamentos","pacotes","parceiros","pedidos","planejar",
  "plano","proposta","receitas","relatorios","suporte",
  "em-breve","onboarding"
]);

const aliases: Record<string,string> = {
  "/login":"/acesso",
  "/cadastro":"/criar-conta",
  "/dashboard":"/afiliado"
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = aliases[pathname];
  if (route && (request.method === "GET" || request.method === "HEAD")) {
    return NextResponse.redirect(new URL(route,request.url),307);
  }

  // Fail closed: old payment events must never grant privileges to Afiliado OS.
  if (pathname.startsWith("/api/billing/") || pathname.startsWith("/api/ai/")) {
    return NextResponse.json(
      { error: "Endpoint legado desativado nesta versão do Afiliado OS." },
      { status: 410, headers: { "cache-control":"no-store" } }
    );
  }

  const segment = pathname.split("/")[1] || "";
  if (legacySegments.has(segment) && (request.method === "GET" || request.method === "HEAD")) {
    return NextResponse.redirect(new URL("/afiliado",request.url),307);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
