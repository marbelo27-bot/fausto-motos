import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAUSTO MOTOS - Sistema de Gestión",
  description: "Sistema de gestión integral para taller de motocicletas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
