import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santino's Barbearia | Ourinhos",
  description: "Seu estilo. Sua rotina. Do seu jeito.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
