"use client";

import { useMemo, useState } from "react";
import { MARKETS, impliedYes, type Market } from "@/lib/protocol";

const stateColor: Record<string, string> = {
  Open: "text-[var(--teal)] border-[var(--teal)]/30 bg-[var(--teal)]/10",
  Closed: "text-[var(--muted)] border-[var(--line)] bg-white/5",
  Resolving: "text-[var(--amber)] border-[var(--amber)]/30 bg-[var(--amber)]/10",
  Resolved: "text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/10",
  Invalid: "text-[var(--rose)] border-[var(--rose)]/30 bg-[var(--rose)]/10",
};

export default function Home() {
  const [filter, setFilter] = useState<"ALL" | Market["state"]>("ALL");
  const [selected, setSelected] = useState<Market>(MARKETS[0] ?? MARKETS[1]);
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
      <div className="border-b border-[var(--amber)]/20 bg-[var(--amber)]/5 px-4 py-2 text-center text-[11px] text-[var(--amber)]">
        Ritual testnet RPC is offline · this UI is a faithful local simulation of the verified contract
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Simulated book
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              Markets
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Stake on YES or NO. Markets resolve themselves via Scheduler → TEE → HTTP → jq.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "Open", "Resolved", "Invalid"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? "bg-white/10 text-white"
                    : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-3">
            {list.length === 0 ? (
              <div className="panel p-8 text-center text-sm text-[var(--muted)]">
                No markets match this filter.
              </div>
            ) : (
              list.map((m) => {
                const pct = impliedYes(m);
                const total = m.totalYes + m.totalNo;
                const isSelected = selected.id === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m)}
                    className={`panel w-full p-5 text-left transition hover:border-[var(--teal)]/30 ${
                      isSelected ? "border-[var(--teal)]/50 bg-[var(--teal)]/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-[11px] text-[var(--muted)]">
                          #{String(m.id).padStart(3, "0")}
                        </span>
                        <span className={`pill ${stateColor[m.state]}`}>{m.state}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-[var(--teal)]">
                          {pct}% YES
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {total.toFixed(2)} ETH pool
                        </div>
                      </div>
                    </div>

                    <h2 className="mt-3 text-[15px] font-medium leading-snug md:text-base">
                      {m.question}
                    </h2>

                    <div className="mt-2 mono text-[11px] text-[var(--muted)]">
                      {m.comparator} {m.target} · attempts {m.attempts}/{m.maxAttempts}
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="text-[var(--teal)]">YES {pct}%</span>
                        <span className="text-[var(--violet)]">NO {100 - pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[var(--teal)] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <aside className="panel sticky top-24 h-fit space-y-5 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-[var(--muted)]">
                  MARKET #{String(selected.id).padStart(3, "0")}
                </span>
                <span className={`pill ${stateColor[selected.state]}`}>
                  {selected.state}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug">
                {selected.question}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  YES pool
                </div>
                <div className="mt-1 font-semibold text-[var(--teal)]">
                  {selected.totalYes.toFixed(2)} ETH
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  NO pool
                </div>
                <div className="mt-1 font-semibold text-[var(--violet)]">
                  {selected.totalNo.toFixed(2)} ETH
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-black/30 p-3 mono text-[11px] text-[var(--muted)] space-y-0.5">
              <div>oracle: {selected.oracleUrl}</div>
              <div>path: {selected.jsonPath}</div>
              <div>
                rule: {selected.comparator} {selected.target}
              </div>
              {selected.observedValue != null && (
                <div>observed: {selected.observedValue}</div>
              )}
              {selected.invalidReason && (
                <div className="text-[var(--rose)]">invalid: {selected.invalidReason}</div>
              )}
            </div>

            {selected.state === "Open" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSide("YES")}
                    className={`rounded-xl border py-3 text-sm font-medium transition ${
                      side === "YES"
                        ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]"
                        : "border-[var(--line)] hover:border-white/20"
                    }`}
                  >
                    YES · {yesPct}¢
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("NO")}
                    className={`rounded-xl border py-3 text-sm font-medium transition ${
                      side === "NO"
                        ? "border-[var(--violet)] bg-[var(--violet)]/15 text-[var(--violet)]"
                        : "border-[var(--line)] hover:border-white/20"
                    }`}
                  >
                    NO · {100 - yesPct}¢
                  </button>
                </div>

                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[var(--teal)]/50"
                  placeholder="Stake (ETH)"
                />

                <button
                  type="button"
                  className="w-full rounded-xl bg-[var(--teal)] py-3 text-sm font-semibold text-black transition hover:brightness-110"
                  onClick={() =>
                    alert("Simulation only — live path would call bet(marketId, isYes).")
                  }
                >
                  Simulate {side} bet
                </button>
              </>
            )}

            {selected.state === "Resolved" && (
              <button
                type="button"
                className="w-full rounded-xl border border-[var(--line)] py-3 text-sm transition hover:border-white/20"
                onClick={() => alert("Simulation of claimWinnings(marketId)")}
              >
                Simulate claimWinnings
              </button>
            )}

            {selected.state === "Invalid" && (
              <button
                type="button"
                className="w-full rounded-xl border border-[var(--line)] py-3 text-sm transition hover:border-white/20"
                onClick={() => alert("Simulation of claimRefund(marketId)")}
              >
                Simulate claimRefund
              </button>
            )}

            <div className="text-[11px] text-[var(--muted)]">
              Pool <span className="text-white">{pool.toFixed(2)} ETH</span> · YES{" "}
              <span className="text-[var(--teal)]">{yesPct}%</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
