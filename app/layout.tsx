import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111522",
};

export const metadata: Metadata = {
  title: "AMOMD FACTURE — La facturation sans prise de tête (FCFA)",
  description:
    "Créez, envoyez et suivez vos factures professionnelles en FCFA. Gestion des devis, factures, TVA et encaissements Mobile Money pour entrepreneurs en Afrique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[#f8f7f3] text-[#111522] antialiased selection:bg-[#ffdc45] selection:text-[#111522]">
        {children}
      </body>
    </html>
  );
}
