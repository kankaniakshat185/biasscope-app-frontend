import type { Metadata } from "next";
import { Sekuya, Geist_Mono, Oswald, Geist } from "next/font/google";
import "./globals.css";

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
        <header className="w-full bg-[#FFF200] border-b-4 border-black px-6 py-4 flex items-center justify-center shadow-sm z-50">
          <a href="/" className="text-3xl font-extrabold text-black tracking-tighter uppercase relative">
            BiasScope
          </a>
        </header>
        <main className="flex-1 flex flex-col relative w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
