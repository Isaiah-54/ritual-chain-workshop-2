"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/proof", label: "Verified" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--teal)]/40 bg-[var(--teal)]/10 text-sm font-bold text-[var(--teal)] shadow-[0_0_16px_-4px_rgba(62,224,197,0.6)]">
              R
            </div>
            <div className="min-w-0">
              <div className="heading text-sm font-semibold tracking-wide">RitualPredict</div>
              <div className="hidden text-[11px] text-[var(--muted)] sm:block">
                Self-resolving · pari-mutuel · on-chain oracle path
              </div>
            </div>
          </Link>

          <a
            href="https://github.com/Isaiah-54/ritual-chain-workshop-2"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--teal)]/50 hover:text-[var(--teal)]"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.28 5.69.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
          </a>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-px text-sm">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative shrink-0 px-3 py-2.5 transition ${
                  active ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[var(--teal)] shadow-[0_0_8px_0_rgba(62,224,197,0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
