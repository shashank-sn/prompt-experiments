import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Prompt Experiments — test content strategies, not AI voices",
  description:
    "Open-source platform for testing which content strategy performs best. Compare variants side-by-side, learn what works, and stop guessing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-semibold text-lg tracking-tight">
                prompt experiments
              </Link>
              <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-500">
                <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  dashboard
                </Link>
                <Link href="/analytics" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  analytics
                </Link>
                <Link href="/compare" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                  compare
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <HyvBadge />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

function HyvBadge() {
  return (
    <a
      href="https://github.com/holdyourvoice/hyv"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs px-2.5 py-1 rounded-full border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
    >
      powered by hyv
    </a>
  );
}
