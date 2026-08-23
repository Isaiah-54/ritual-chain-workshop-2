"use client";

import { useMemo, useState } from "react";
import { MARKETS, PIPELINE, PROOF, impliedYes, type Market } from "@/lib/protocol";
import { ResolutionConsole } from "@/components/ResolutionConsole";

const stateColor: Record<string, string> = {
  Open: "text-[var(--teal)] border-[var(--teal)]/30 bg-[var(--teal)]/10",
  Closed: "text-[var(--muted)] border-[var(--line)] bg-white/5",
  Resolving: "text-[var(--amber)] border-[var(--amber)]/30 bg-[var(--amber)]/10",
  Resolved: "text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/10",
  Invalid: "text-[var(--rose)] border-[var(--rose)]/30 bg-[var(--rose)]/10",
};

export default function Home() {
  const [filter, setFilter] = useState<"ALL" | Market["state"]>("ALL");
  const [selected, setSelected] = useState<Market>(MARKETS[1]);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState("0.5");

  const list = useMemo(
    () => (filter === "ALL" ? MARKETS : MARKETS.filter((m) => m.state === filter)),
    [filter],
  );
  const yesPct = impliedYes(selected);
  const pool = selected.totalYes + selected.totalNo;

  return (
    <main className="grid-bg min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--teal)]/40 bg-[var(--teal)]/10 text-sm font-bold text-[var(--teal)]">R</div>
            <div>
              <div className="text-sm font-semibold tracking-wide">RitualPredict</div>
              <div className="text-[11px] text-[var(--muted)]">Self-resolving · pari-mutuel · on-chain oracle path</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="pill text-[var(--amber)]">{PROOF.total} tests</span>
            <span className="pill text-[var(--muted)]">Simulation</span>
            <a href={PROOF.github} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs hover:border-[var(--teal)]/50">GitHub</a>
          </div>
        </div>
        <div className="border-t border-[var(--amber)]/20 bg-[var(--amber)]/5 px-4 py-2 text-center text-[11px] text-[var(--amber)]">
          {PROOF.banner}
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <section className="panel overflow-hidden p-6 md:p-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="pill text-[var(--teal)]">Scheduler → TEE → HTTP → jq</span>
            <span className="pill text-[var(--violet)]">{PROOF.solidity} Solidity</span>
            <span className="pill text-[var(--violet)]">{PROOF.typescript} TypeScript</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            Markets that resolve themselves.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
            Stake on YES or NO. At resolveBlock the Scheduler wakes the contract: TEE → HTTP → jq → compare.
            Failures retry up to three times, then Invalid + refund — never treat a failed read as NO.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#markets" className="rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-medium text-black">Explore markets</a>
            <a href="#pipeline" className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Resolution pipeline</a>
            <a href="#proof" className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Proof of building</a>
          </div>
        </section>

        <section id="pipeline" className="space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">01 · Protocol</div>
            <h2 className="text-2xl font-semibold">How live resolution works</h2>
          </div>
          <div className="panel p-4 md:p-6">
            <div className="grid gap-2 md:grid-cols-6">
              {PIPELINE.map((step, i) => (
                <button key={step.id} type="button" onClick={() => setPipelineStep(i)}
                  className={`rounded-xl border p-3 text-left transition ${
                    pipelineStep === i ? "border-[var(--teal)]/50 bg-[var(--teal)]/10" : "border-[var(--line)] bg-black/20"
                  }`}>
                  <div className="mono text-[10px] text-[var(--muted)]">0{i + 1}</div>
                  <div className="mt-1 text-sm font-medium">{step.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/30 p-4">
              <div className="text-sm font-medium text-[var(--teal)]">{PIPELINE[pipelineStep].label}</div>
              <p className="mt-1 text-sm text-[var(--muted)]">{PIPELINE[pipelineStep].detail}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">01b · Simulation</div>
            <h2 className="text-2xl font-semibold">Run resolution</h2>
          </div>
          <ResolutionConsole market={selected} />
        </section>

        <section id="markets" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">02 · Markets</div>
                <h2 className="text-2xl font-semibold">Simulated book</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["ALL", "Open", "Resolved", "Invalid"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs ${filter === f ? "bg-white/10 text-white" : "text-[var(--muted)]"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {list.map((m) => (
                <button key={m.id} type="button" onClick={() => setSelected(m)}
                  className={`panel w-full p-4 text-left ${selected.id === m.id ? "border-[var(--teal)]/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-[11px] text-[var(--muted)]">#{String(m.id).padStart(3, "0")}</span>
                        <span className={`pill ${stateColor[m.state]}`}>{m.state}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium md:text-base">{m.question}</div>
                      <div className="mt-2 mono text-[11px] text-[var(--muted)]">
                        {m.comparator} {m.target} · attempts {m.attempts}/{m.maxAttempts}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[var(--teal)]">{impliedYes(m)}% YES</div>
                      <div className="text-[11px] text-[var(--muted)]">pool {(m.totalYes + m.totalNo).toFixed(2)} ETH</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="panel sticky top-24 h-fit space-y-5 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-[var(--muted)]">MARKET #{String(selected.id).padStart(3, "0")}</span>
                <span className={`pill ${stateColor[selected.state]}`}>{selected.state}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug">{selected.question}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <div className="text-[10px] uppercase text-[var(--muted)]">YES pool</div>
                <div className="mt-1 font-semibold text-[var(--teal)]">{selected.totalYes.toFixed(2)} ETH</div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <div className="text-[10px] uppercase text-[var(--muted)]">NO pool</div>
                <div className="mt-1 font-semibold text-[var(--violet)]">{selected.totalNo.toFixed(2)} ETH</div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-black/30 p-3 mono text-[11px] text-[var(--muted)]">
              <div>oracle: {selected.oracleUrl}</div>
              <div>path: {selected.jsonPath}</div>
              <div>rule: {selected.comparator} {selected.target}</div>
              {selected.observedValue != null && <div>observed: {selected.observedValue}</div>}
              {selected.invalidReason && <div className="text-[var(--rose)]">invalid: {selected.invalidReason}</div>}
            </div>
            {selected.state === "Open" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSide("YES")}
                    className={`rounded-xl border py-3 text-sm font-medium ${side === "YES" ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]" : "border-[var(--line)]"}`}>
                    YES · {yesPct}¢
                  </button>
                  <button type="button" onClick={() => setSide("NO")}
                    className={`rounded-xl border py-3 text-sm font-medium ${side === "NO" ? "border-[var(--violet)] bg-[var(--violet)]/15 text-[var(--violet)]" : "border-[var(--line)]"}`}>
                    NO · {100 - yesPct}¢
                  </button>
                </div>
                <input value={stake} onChange={(e) => setStake(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2.5 text-sm outline-none" placeholder="Stake (ETH)" />
                <button type="button"
                  className="w-full rounded-xl bg-[var(--teal)] py-3 text-sm font-semibold text-black"
                  onClick={() => alert("Simulation only — live path would call bet(marketId, isYes).")}>
                  Simulate {side} bet
                </button>
              </>
            )}
            {selected.state === "Resolved" && (
              <button type="button" className="w-full rounded-xl border border-[var(--line)] py-3 text-sm"
                onClick={() => alert("Simulation of claimWinnings(marketId)")}>
                Simulate claimWinnings
              </button>
            )}
            {selected.state === "Invalid" && (
              <button type="button" className="w-full rounded-xl border border-[var(--line)] py-3 text-sm"
                onClick={() => alert("Simulation of claimRefund(marketId)")}>
                Simulate claimRefund
              </button>
            )}
            <div className="text-[11px] text-[var(--muted)]">
              Pool <span className="text-white">{pool.toFixed(2)} ETH</span> · YES{" "}
              <span className="text-[var(--teal)]">{yesPct}%</span>
            </div>
          </aside>
        </section>

        <section id="proof" className="panel space-y-4 p-6 md:p-8">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">03 · Proof</div>
          <h2 className="text-2xl font-semibold">Verified locally · {PROOF.total} tests green</h2>
          <p className="max-w-3xl text-sm text-[var(--muted)]">
            No live deploy — testnet RPC offline. Contract + mocks verified with Hardhat.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-4">
              <div className="text-3xl font-semibold text-[var(--teal)]">{PROOF.solidity}</div>
              <div className="text-xs text-[var(--muted)]">Solidity</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-4">
              <div className="text-3xl font-semibold text-[var(--violet)]">{PROOF.typescript}</div>
              <div className="text-xs text-[var(--muted)]">TypeScript</div>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-black/25 p-4">
              <div className="text-3xl font-semibold">{PROOF.total}</div>
              <div className="text-xs text-[var(--muted)]">Total</div>
            </div>
          </div>
          <a href={PROOF.github} target="_blank" rel="noreferrer"
            className="inline-flex rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 px-4 py-2.5 text-sm text-[var(--teal)]">
            Open GitHub
          </a>
        </section>

        <footer className="border-t border-[var(--line)] py-8 text-center text-xs text-[var(--muted)]">
          RitualPredict · Bootcamp 2 · Simulation · Isaiah-54
        </footer>
      </div>
    </main>
  );
}
