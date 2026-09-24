import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AxeScanner } from "@/components/layout/AxeScanner";

/* Stitch "Polar Expedition Command" system — Inter is deployed universally
   across headlines, tabular blocks, interactive elements and UI annotations. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "POLAR-X — Polar Expedition Command & Logistics System",
  description:
    "SIH26062 · Integrated Polar Expedition Logistics and Asset Management System for the Ministry of Earth Sciences. Interactive prototype demonstrating unified polar expedition command, predictive logistics, asset intelligence and emergency response.",
  keywords: [
    "POLAR-X",
    "Smart India Hackathon 2026",
    "SIH26062",
    "MoES",
    "polar expedition",
    "Antarctica",
    "logistics",
  ],
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-body`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
        {process.env.NODE_ENV === "development" ? <AxeScanner /> : null}
      </body>
    </html>
  );
}
