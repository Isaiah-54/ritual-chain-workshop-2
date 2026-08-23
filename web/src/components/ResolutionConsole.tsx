"use client";

import { useEffect, useRef, useState } from "react";
import type { Market } from "@/lib/protocol";
import { simulateResolution, type ResolveLog } from "@/lib/resolve-sim";

const levelClass: Record<string, string> = {
  info: "text-[var(--muted)]",
  ok: "text-[var(--green)]",
  warn: "text-[var(--amber)]",
  err: "text-[var(--rose)]",
};

export function ResolutionConsole({ market }: { market: Market }) {
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState<ResolveLog[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible]);

  useEffect(() => {
    setVisible([]);
    setDone(false);
    setSummary(null);
    setRunning(false);
  }, [market.id]);

  async function run(mode: "success" | "fail-then-ok" | "fail-all") {
    if (running) return;
    setRunning(true);
    setVisible([]);
    setDone(false);
    setSummary(null);

    const forceFail = mode === "fail-all" ? 3 : mode === "fail-then-ok" ? 1 : 0;
    const result = simulateResolution(market, {
      forceFailAttempts: forceFail,
      observedOverride:
        market.observedValue ??
        (market.comparator === "LT" || market.comparator === "LTE"
          ? market.target - 5
          : market.target + 126),
    });

    for (let i = 0; i < result.logs.length; i++) {
      await new Promise((r) => setTimeout(r, 380));
      setVisible((prev) => [...prev, result.logs[i]]);
    }

    setSummary(
      result.finalState === "Resolved"
        ? `Final: Resolved · ${result.outcome} · observed ${result.observed} · attempts ${result.attempts}`
        : `Final: Invalid · attempts ${result.attempts}`,
    );
    setDone(true);
    setRunning(false);
  }

  return (
    <div className="panel overflow-hidden max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Resolution console
          </div>
          <div className="text-sm font-medium">
            Market #{String(market.id).padStart(3, "0")} · onScheduledResolve
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={running} onClick={() => run("success")}
            className="rounded-lg bg-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50">
            Run success path
          </button>
          <button type="button" disabled={running} onClick={() => run("fail-then-ok")}
            className="rounded-lg border border-[var(--amber)]/40 px-3 py-1.5 text-xs text-[var(--amber)] disabled:opacity-50">
            Fail 1× then resolve
          </button>
          <button type="button" disabled={running} onClick={() => run("fail-all")}
            className="rounded-lg border border-[var(--rose)]/40 px-3 py-1.5 text-xs text-[var(--rose)] disabled:opacity-50">
            Exhaust 3 attempts
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto overflow-x-hidden bg-black/40 px-4 py-3 font-mono text-[12px] leading-6">
        {visible.length === 0 && !running && (
          <div className="text-[var(--muted)]">
            Stream Scheduler → TEE → HTTP → jq → compare · same path as Hardhat tests.
          </div>
        )}
        {visible.map((line, i) => (
          <div key={`${line.t}-${i}`} className="flex gap-3 min-w-0">
            <span className="shrink-0 text-[var(--muted)]/70">{line.t}</span>
            <span className={`${levelClass[line.level]} min-w-0 flex-1 whitespace-pre-wrap break-words`}>{line.msg}</span>
          </div>
        ))}
        {running && <div className="mt-1 animate-pulse text-[var(--teal)]">▌ executing…</div>}
        <div ref={bottomRef} />
      </div>
      {done && summary && (
        <div className={`border-t border-[var(--line)] px-4 py-3 text-sm ${
          summary.startsWith("Final: Resolved")
            ? "bg-[var(--green)]/10 text-[var(--green)]"
            : "bg-[var(--rose)]/10 text-[var(--rose)]"
        }`}>
          {summary}
        </div>
      )}
    </div>
  );
}
