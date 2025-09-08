
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sleep Journal",
  description: "Registra tu sueño diario (fecha, nota, comentarios).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
