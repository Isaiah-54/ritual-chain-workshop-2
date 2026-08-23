import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RitualPredict · Self-resolving markets",
  description:
    "Pari-mutuel prediction markets resolved by Scheduler → TEE → HTTP → jq. 74 local tests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--teal)]/40 bg-[var(--teal)]/10 text-sm font-bold text-[var(--teal)] shadow-[0_0_16px_-4px_rgba(62,224,197,0.6)]">
                R
              </div>
              <div>
                <div className="heading text-sm font-semibold tracking-wide">
                  RitualPredict
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  Self-resolving · pari-mutuel · on-chain oracle path
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
              >
                Markets
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
              >
                How it works
              </Link>
              <Link
                href="/proof"
                className="rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
              >
                Verified
              </Link>
              <a
                href="https://github.com/Isaiah-54/ritual-chain-workshop-2"
                target="_blank"
                rel="noreferrer"
                className="ml-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs transition hover:border-[var(--teal)]/50 hover:text-[var(--teal)]"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
