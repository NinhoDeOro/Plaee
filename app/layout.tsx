import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { ProviderAttribution } from "@/components/ProviderAttribution";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Plaee";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plaee.it";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} - risultati live, calendario e news sportive`,
    template: `%s | ${siteName}`
  },
  description: "Risultati sportivi live, calendario eventi e news aggiornate in una dashboard veloce e mobile-first.",
  openGraph: {
    title: `${siteName} - sport live`,
    description: "Risultati, partite e news sportive aggiornate in tempo reale.",
    url: siteUrl,
    siteName,
    locale: "it_IT",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  themeColor: "#090b10",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        <AppHeader />
        {children}
        <ProviderAttribution />
        <Footer />
      </body>
    </html>
  );
}
