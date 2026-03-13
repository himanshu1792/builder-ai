import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "./components/TopNav";
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
  title: "TestForge",
  description:
    "AI-powered test generation platform — describe what to test in plain English and get a ready-to-merge PR with working Playwright scripts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface`}
      >
        <TopNav />
        <main className="w-full px-4 py-8 sm:px-6 lg:px-10 bg-gradient-to-b from-surface via-surface to-surface-dim min-h-[calc(100vh-60px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
