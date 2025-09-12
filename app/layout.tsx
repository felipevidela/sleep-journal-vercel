
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PWAPrompt from "@/components/PWAPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sleep Journal - Tu diario de sueño personal",
  description: "Registra, analiza y mejora tu calidad de sueño. Con gráficos, estadísticas y exportación de datos. Optimizado para móviles.",
  keywords: "sueño, journal, diario, salud, bienestar, tracking, móvil",
  authors: [{ name: "Sleep Journal" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sleep Journal"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('darkMode');
                  const isDark = stored !== null 
                    ? stored === 'true' 
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.warn('Dark mode initialization failed:', e);
                }
              })();
            `,
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
          <PWAPrompt />
        </div>
      </body>
    </html>
  );
}
