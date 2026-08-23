import { PROOF } from "@/lib/protocol";

export default function ProofPage() {
  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="panel space-y-6 p-6 md:p-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Proof
            </div>
            <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
              Verified locally · {PROOF.total} tests green
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              No live deploy — testnet RPC offline. Contract + mocks verified with Hardhat.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-5">
              <div className="text-4xl font-semibold text-[var(--teal)]">
                {PROOF.solidity}
              </div>
              <div className="text-sm text-[var(--muted)]">Solidity</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-5">
              <div className="text-4xl font-semibold text-[var(--violet)]">
                {PROOF.typescript}
              </div>
              <div className="text-sm text-[var(--muted)]">TypeScript</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-5">
              <div className="text-4xl font-semibold">{PROOF.total}</div>
              <div className="text-sm text-[var(--muted)]">Total</div>
            </div>
          </div>

          <a
            href={PROOF.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 px-5 py-2.5 text-sm text-[var(--teal)]"
          >
            Open GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
