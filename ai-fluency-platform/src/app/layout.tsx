import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { ProviderProvider } from "@/lib/store/provider-context";
import { IOSInstallPrompt } from "@/components/pwa/IOSInstallPrompt";

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
  title: "Learning Platform",
  description:
    "Evidence-based learning with interactive exercises, AI-powered feedback, and structured progression.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Learning Platform",
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
          <ProviderProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
            <IOSInstallPrompt />
          </ProviderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
