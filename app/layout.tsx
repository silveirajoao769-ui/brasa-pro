import type { Metadata } from "next";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://brasa-pro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Brasa Pro — A plataforma completa do churrasco",
    template: "%s | Brasa Pro",
  },
  description: "Planeje, compre, cozinhe e lucre com o Brasa Pro.",
  applicationName: "Brasa Pro",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Brasa Pro",
    title: "Brasa Pro — A plataforma completa do churrasco",
    description: "Planeje churrascos e gerencie sua operação profissional em um só lugar.",
    url: appUrl,
  },
  twitter: {
    card: "summary",
    title: "Brasa Pro",
    description: "Planejamento e gestão profissional de churrascos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
