import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { AuthProvider } from "@/lib/auth-context";
import { ProviderProvider } from "@/lib/store/provider-context";
import { IOSInstallPrompt } from "@/components/pwa/IOSInstallPrompt";
import { DailyQuizProvider } from "@/components/review/DailyQuizProvider";
import { SyncProvider } from "@/components/sync/SyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Palestra",
  description:
    "Earned mastery through active practice, spaced repetition, and AI-powered drills. Learn skills that stick.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Palestra",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <SyncProvider>
          <ProviderProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <ConditionalFooter />
            <IOSInstallPrompt />
            <DailyQuizProvider />
          </ProviderProvider>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
