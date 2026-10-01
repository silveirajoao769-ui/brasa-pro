import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brasa Pro — A plataforma completa do churrasco",
  description: "Planeje, compre, cozinhe e lucre com o Brasa Pro.",
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
