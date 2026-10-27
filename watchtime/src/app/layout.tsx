import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "WATCHTIME",
  description: "Ofertas e oportunidades em relógios nas principais relojoarias do Brasil",
  applicationName: "WATCHTIME",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "WATCHTIME" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(72px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <Nav />
        <SWRegister />
      </body>
    </html>
  );
}
