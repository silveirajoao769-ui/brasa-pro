import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://brasa-pro.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/termos", "/privacidade"],
        disallow: [
          "/dashboard",
          "/onboarding",
          "/clientes",
          "/eventos",
          "/agenda",
          "/equipe",
          "/pacotes",
          "/financeiro",
          "/relatorios",
          "/estoque",
          "/fornecedores",
          "/fornecedor",
          "/configuracoes",
          "/orcamentos",
          "/proposta",
          "/contrato",
          "/pedidos",
          "/compras",
          "/churrascos",
          "/plano",
          "/login",
          "/cadastro",
          "/esqueci-senha",
          "/nova-senha",
          "/auth",
          "/api",
          "/ia-brasa",
        ],
      },
    ],
    sitemap: baseUrl + "/sitemap.xml",
  };
}
