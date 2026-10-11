import type { Metadata } from "next";
import "./globals.css";
import "./affiliate.css";

export const metadata: Metadata = {
  title: { default: "Afiliado OS — Venda com método", template: "%s | Afiliado OS" },
  description: "A operação do afiliado e o acompanhamento dos mentores em um só lugar.",
  applicationName: "Afiliado OS",
  robots: { index: false, follow: false }, // Ambiente em migração: ativar após publicação.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
