import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RitualPredict · Self-resolving markets",
  description:
    "Pari-mutuel prediction markets resolved by Scheduler → TEE → HTTP → jq. 74 local tests. Simulation while Ritual testnet RPC is offline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
