import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "PostulaTrack | Gestión de postulaciones",
  description: "Organiza oportunidades, postulaciones y cada cambio de estado en un solo lugar.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
