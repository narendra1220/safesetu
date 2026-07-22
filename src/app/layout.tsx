import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://safesetu.dev"),
  title: {
    default: "SafeSetu",
    template: "%s | SafeSetu",
  },
  description:
    "One-click security scanner for AI-built apps. Catches exposed secrets, missing RLS, unauthenticated routes, and more.",
  openGraph: {
    title: "SafeSetu",
    description:
      "One-click security scanner for AI-built apps. Ship only when it's safe.",
    url: "https://safesetu.dev",
    siteName: "SafeSetu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeSetu",
    description:
      "One-click security scanner for AI-built apps. Ship only when it's safe.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
