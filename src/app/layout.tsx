import type { Metadata } from "next";
import { Sekuya, Geist_Mono, Oswald, Geist } from "next/font/google";
import "./globals.css";
import { AuthButton } from "../components/AuthButton";

const sekuyaFont = Sekuya({
  variable: "--font-sekuya",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswaldFont = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BiasScope",
  description: "AI-powered News Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sekuyaFont.variable} ${geistMono.variable} ${oswaldFont.variable} ${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col vox-bg">
        <header className="w-full bg-[#FFF200] border-b-4 border-black px-6 py-5 flex items-center justify-between z-50 sticky top-0">
          <a href="/" className="text-3xl font-extrabold text-[#1A1A1A] tracking-tighter uppercase relative flex-1">
            BiasScope
          </a>
          <div className="flex justify-end items-center gap-6 relative z-50">
            <AuthButton />
          </div>
        </header>
        <main className="flex-1 flex flex-col relative w-full">
          {children}
        </main>
              </body>
    </html>
  );
}
