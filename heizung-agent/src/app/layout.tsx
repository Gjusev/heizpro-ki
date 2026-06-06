import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HeizPro KI – Sprachverkaufsagent",
  description: "KI-Sprachverkaufsagent fuer Heizung, Klima und Sanitaer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] grain-overlay">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 lg:ml-72 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
