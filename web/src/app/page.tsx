"use client";

import { useMemo, useState } from "react";
import { MARKETS, PROOF, impliedYes, type Market } from "@/lib/protocol";

const stateColor: Record<string, string> = {
  Open: "text-[var(--teal)] border-[var(--teal)]/30 bg-[var(--teal)]/10",
  Closed: "text-[var(--muted)] border-[var(--line)] bg-white/5",
  Resolving: "text-[var(--amber)] border-[var(--amber)]/30 bg-[var(--amber)]/10",
  Resolved: "text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/10",
  Invalid: "text-[var(--rose)] border-[var(--rose)]/30 bg-[var(--rose)]/10",
};

const categoryColor: Record<string, string> = {
  Crypto: "var(--teal)",
  Demo: "var(--violet)",
  Network: "var(--amber)",
  "Edge case": "var(--rose)",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="panel panel-hover p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="heading mt-1 text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function OddsRing({ pct }: { pct: number }) {
  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--teal) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--panel)] mono text-[13px] font-semibold">
        {pct}%
      </div>
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<"ALL" | Market["state"]>("ALL");
  const [selected, setSelected] = useState<Market>(MARKETS[0] ?? MARKETS[1]);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState("0.5");
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const list = useMemo(
    () => (filter === "ALL" ? MARKETS : MARKETS.filter((m) => m.state === filter)),
    [filter],
  );

  const totalVolume = useMemo(
    () => MARKETS.reduce((sum, m) => sum + m.totalYes + m.totalNo, 0),
    [],
  );
  const resolvedCount = useMemo(
    () => MARKETS.filter((m) => m.state === "Resolved").length,
    [],
  );

  const yesPct = impliedYes(selected);
  const pool = selected.totalYes + selected.totalNo;

  const stakeNum = Number(stake) || 0;
  const sidePool = side === "YES" ? selected.totalYes : selected.totalNo;
  const projectedPool = pool + stakeNum;
  const projectedSidePool = sidePool + stakeNum;
  const projectedPayout =
    stakeNum > 0 && projectedSidePool > 0
      ? (stakeNum * projectedPool) / projectedSidePool
      : 0;

  return (
    <main className="grid-bg min-h-screen">
      <div className="border-b border-[var(--amber)]/20 bg-[var(--amber)]/5 px-4 py-2 text-center text-[11px] text-[var(--amber)]">
        Ritual testnet RPC is offline · this UI is a faithful local simulation of the verified contract
      </div>

      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="fade-up max-w-3xl">
            <span className="pill pill-glow inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] pulse-dot" />
              Live simulation · verified contract
            </span>
            <h1 className="heading mt-5 text-4xl font-semibold leading-[1.08] md:text-6xl">
              Prediction markets that{" "}
              <span className="text-gradient">resolve themselves</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
              Stake YES or NO on real-world outcomes. No oracle committee, no admin
              key — each market wakes itself via Scheduler → TEE → HTTP → jq and pays
              out automatically.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#markets"
                className="rounded-full bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Browse markets
              </a>
              <a
                href="/how-it-works"
                className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm transition hover:border-[var(--teal)]/50 hover:text-[var(--teal)]"
              >
                See resolution path
              </a>
            </div>
          </div>

          <div className="fade-up fade-up-1 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tests passing" value={`${PROOF.total}`} accent="var(--teal)" />
            <StatCard
              label="Total volume"
              value={`${totalVolume.toFixed(2)} ETH`}
              accent="var(--violet)"
            />
            <StatCard label="Markets" value={`${MARKETS.length}`} accent="var(--amber)" />
            <StatCard label="Resolved" value={`${resolvedCount}`} accent="var(--green)" />
          </div>
        </div>
      </section>

      <div id="markets" className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Order book
            </div>
            <h2 className="heading mt-1 text-2xl font-semibold md:text-3xl">
              All markets
            </h2>
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
                const accent = categoryColor[m.category] ?? "var(--teal)";

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m)}
                    className={`panel panel-hover w-full p-5 text-left ${
                      isSelected ? "border-[var(--teal)]/50 bg-[var(--teal)]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <OddsRing pct={pct} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mono text-[11px] text-[var(--muted)]">
                            #{String(m.id).padStart(3, "0")}
                          </span>
                          <span className={`pill ${stateColor[m.state]}`}>{m.state}</span>
                          <span
                            className="pill"
                            style={{ color: accent, borderColor: `${accent}55` }}
                          >
                            {m.category}
                          </span>
                        </div>

                        <h3 className="heading mt-2 text-[15px] font-medium leading-snug md:text-base">
                          {m.question}
                        </h3>

                        <div className="mt-1 mono text-[11px] text-[var(--muted)]">
                          {m.comparator} {m.target} · attempts {m.attempts}/{m.maxAttempts} ·{" "}
                          {total.toFixed(2)} ETH pool
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-[var(--teal)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="h-full bg-[var(--violet)] transition-all"
                        style={{ width: `${100 - pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px]">
                      <span className="text-[var(--teal)]">YES {pct}%</span>
                      <span className="text-[var(--violet)]">NO {100 - pct}%</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <aside className="panel panel-hover sticky top-24 h-fit space-y-5 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono text-[11px] text-[var(--muted)]">
                  MARKET #{String(selected.id).padStart(3, "0")}
                </span>
                <span className={`pill ${stateColor[selected.state]}`}>
                  {selected.state}
                </span>
              </div>
              <h3 className="heading mt-2 text-lg font-semibold leading-snug">
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

            <div className="rounded-xl border border-[var(--line)] bg-black/30 p-3 mono text-[11px] space-y-1">
              <div><span className="text-[var(--muted)]">oracle:</span> <span className="text-[var(--text)]">{selected.oracleUrl}</span></div>
              <div><span className="text-[var(--muted)]">path:</span> <span className="text-[var(--text)]">{selected.jsonPath}</span></div>
              <div>
                <span className="text-[var(--muted)]">rule:</span> <span className="text-[var(--text)]">{selected.comparator} {selected.target}</span>
              </div>
              {selected.observedValue != null && (
                <div><span className="text-[var(--muted)]">observed:</span> <span className="text-[var(--teal)]">{selected.observedValue}</span></div>
              )}
              {selected.invalidReason && (
                <div><span className="text-[var(--muted)]">invalid:</span> <span className="text-[var(--rose)]">{selected.invalidReason}</span></div>
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

                {stakeNum > 0 && (
                  <div className="rounded-xl border border-[var(--line)] bg-black/20 px-3 py-2 text-[11px] text-[var(--muted)]">
                    If <span className="text-[var(--text)]">{side}</span> wins, you'd
                    receive ~
                    <span className="text-[var(--teal)]">
                      {" "}
                      {projectedPayout.toFixed(3)} ETH
                    </span>{" "}
                    (same pari-mutuel math as the contract)
                  </div>
                )}

                <button
                  type="button"
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition hover:brightness-110 ${
                    side === "YES"
                      ? "bg-[var(--teal)] text-black"
                      : "bg-[var(--violet)] text-black"
                  }`}
                  onClick={() =>
                    setSimMessage(
                      `bet(${selected.id}, ${side === "YES"}) → staked ${stakeNum.toFixed(3)} ETH on ${side}. Projected payout if ${side} wins: ~${projectedPayout.toFixed(3)} ETH`,
                    )
                  }
                >
                  Simulate {side} bet
                </button>
              </>
            )}

            {selected.state === "Resolved" && (
              <>
                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[var(--teal)]/50"
                  placeholder="Your stake on the winning side (ETH)"
                />
                <button
                  type="button"
                  className="w-full rounded-xl border border-[var(--line)] py-3 text-sm font-medium text-[var(--text)] transition hover:border-[var(--teal)]/50 hover:text-[var(--teal)]"
                  onClick={() => {
                    const winningPool =
                      selected.outcome === "Yes" ? selected.totalYes : selected.totalNo;
                    const totalPool = selected.totalYes + selected.totalNo;
                    const payout =
                      winningPool > 0 ? (stakeNum * totalPool) / winningPool : 0;
                    setSimMessage(
                      payout > 0
                        ? `claimWinnings(${selected.id}) → ${payout.toFixed(3)} ETH (assumes ${stakeNum} ETH staked on the winning ${selected.outcome} side, stake × pool ÷ winning pool)`
                        : `claimWinnings(${selected.id}) → 0 ETH (no stake on the winning side, or nothing to claim)`,
                    );
                  }}
                >
                  Simulate claimWinnings
                </button>
              </>
            )}

            {selected.state === "Invalid" && (
              <>
                <input
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[var(--teal)]/50"
                  placeholder="Your stake (ETH)"
                />
                <button
                  type="button"
                  className="w-full rounded-xl border border-[var(--line)] py-3 text-sm font-medium text-[var(--text)] transition hover:border-[var(--teal)]/50 hover:text-[var(--teal)]"
                  onClick={() =>
                    setSimMessage(
                      stakeNum > 0
                        ? `claimRefund(${selected.id}) → ${stakeNum.toFixed(3)} ETH refunded (exact stake returned, no payout multiplier)`
                        : `claimRefund(${selected.id}) → 0 ETH (enter a stake above to simulate a refund)`,
                    )
                  }
                >
                  Simulate claimRefund
                </button>
              </>
            )}

            <div className="text-[11px] text-[var(--muted)]">
              Pool <span className="text-white">{pool.toFixed(2)} ETH</span> · YES{" "}
              <span className="text-[var(--teal)]">{yesPct}%</span>
            </div>
            {simMessage && (
              <div className="rounded-xl border border-[var(--teal)]/30 bg-[var(--teal)]/5 px-3 py-2.5 text-[11px] leading-relaxed text-[var(--teal)]">
                {simMessage}
              </div>
            )}
          </aside>
        </div>
      </div>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[11px] text-[var(--muted)]">
        <a
          href={PROOF.github}
          target="_blank"
          rel="noreferrer"
          className="hover:text-[var(--teal)]"
        >
          {PROOF.solidity} Solidity tests · {PROOF.typescript} TypeScript tests · view source on GitHub
        </a>
      </footer>
    </main>
  );
}
