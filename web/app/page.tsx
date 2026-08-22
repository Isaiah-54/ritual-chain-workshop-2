"use client";

import { useEffect, useState, useCallback } from "react";
import { formatEther } from "viem";
import {
  connectWallet,
  createMarket,
  getMarkets,
  getStakes,
  claimRefund,
  claimWinnings,
  placeBet,
} from "@/lib/contract";
import {
  Comparator,
  comparatorLabel,
  Market,
  MarketState,
  Outcome,
  Stakes,
} from "@/lib/types";

const stateLabel: Record<MarketState, string> = {
  [MarketState.Open]: "Open",
  [MarketState.Closed]: "Closed",
  [MarketState.Resolving]: "Resolving",
  [MarketState.Resolved]: "Resolved",
  [MarketState.Invalid]: "Invalid",
};

const stateColor: Record<MarketState, string> = {
  [MarketState.Open]: "text-signal",
  [MarketState.Closed]: "text-fog",
  [MarketState.Resolving]: "text-amber-400",
  [MarketState.Resolved]: "text-signal",
  [MarketState.Invalid]: "text-red-400",
};

export default function Page() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stakesByMarket, setStakesByMarket] = useState<Record<string, Stakes>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getMarkets();
      setMarkets(list.slice().reverse());
      if (account) {
        const entries = await Promise.all(
          list.map(async (m) => [m.id.toString(), await getStakes(m.id, account)] as const)
        );
        setStakesByMarket(Object.fromEntries(entries));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load markets.");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleConnect() {
    try {
      const addr = await connectWallet();
      setAccount(addr);
    } catch (e: any) {
      setError(e?.message || "Wallet connection failed.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
      <div className="mb-8 rounded border border-signal/30 bg-signal/5 px-4 py-2.5 text-xs text-signal">
        Demo mode &mdash; showing simulated markets, no live contract is deployed.
      </div>

      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
            Ritual Chain &middot; Academy Project
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-paper">
            Predict
          </h1>
          <p className="mt-1 text-sm text-fog">
            On-chain markets, resolved by the scheduler &mdash; no oracle committee.
          </p>
        </div>
        {account ? (
          <p className="font-mono text-sm text-fog tabular">
            {account.slice(0, 6)}&hellip;{account.slice(-4)}
          </p>
        ) : (
          <button
            onClick={handleConnect}
            className="rounded border border-signal bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition hover:bg-signal/20"
          >
            Connect wallet
          </button>
        )}
      </header>

      {error && (
        <div className="mb-5 rounded border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm text-fog">
          {loading ? "Loading markets\u2026" : `${markets.length} market${markets.length === 1 ? "" : "s"}`}
        </span>
        <div className="flex gap-2.5">
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded border border-line px-4 py-2 text-sm text-paper transition hover:border-signal disabled:opacity-40"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded border border-signal bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition hover:bg-signal/20"
          >
            {showCreate ? "Close" : "New market"}
          </button>
        </div>
      </div>

      {showCreate && (
        <CreatePanel
          account={account}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
          onError={setError}
        />
      )}

      {!loading && markets.length === 0 && (
        <div className="rounded border border-dashed border-line py-10 text-center text-sm text-fog">
          No markets yet. Be the first to create one.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {markets.map((m) => (
          <MarketCard
            key={m.id.toString()}
            market={m}
            account={account}
            stakes={stakesByMarket[m.id.toString()]}
            onChanged={refresh}
            onError={setError}
            onNeedAccount={handleConnect}
          />
        ))}
      </div>
    </main>
  );
}

function CreatePanel({
  account,
  onCreated,
  onError,
}: {
  account: `0x${string}` | null;
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [oracleUrl, setOracleUrl] = useState("");
  const [jsonPath, setJsonPath] = useState("");
  const [target, setTarget] = useState("");
  const [comparator, setComparator] = useState<Comparator>(Comparator.GTE);
  const [bettingMinutes, setBettingMinutes] = useState("10");
  const [resolveDelayMinutes, setResolveDelayMinutes] = useState("2");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await createMarket((account ?? "0x0000000000000000000000000000000000000000") as `0x${string}`, {
        question,
        oracleUrl,
        jsonPath,
        target: BigInt(target || "0"),
        comparator,
        bettingSeconds: BigInt(Number(bettingMinutes) * 60),
        resolveDelaySeconds: BigInt(Number(resolveDelayMinutes) * 60),
      });
      onCreated();
    } catch (e: any) {
      onError(e?.message || "Failed to create market.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-7 rounded border border-line bg-white/[0.02] p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-paper">New market</h2>

      <Field label="Question">
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will ETH close above $4,000?"
        />
      </Field>
      <Field label="Oracle URL">
        <input
          className="input"
          value={oracleUrl}
          onChange={(e) => setOracleUrl(e.target.value)}
          placeholder="https://your-tunnel.example.com/price"
        />
      </Field>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <Field label="JSON path">
          <input className="input" value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} placeholder="price" />
        </Field>
        <Field label="Target value">
          <input className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="4000" />
        </Field>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <Field label="Comparator">
          <select
            className="input"
            value={comparator}
            onChange={(e) => setComparator(Number(e.target.value) as Comparator)}
          >
            {Object.values(Comparator)
              .filter((v) => typeof v === "number")
              .map((v) => (
                <option key={v} value={v as number}>
                  {comparatorLabel[v as Comparator]}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Betting window (min)">
          <input className="input" value={bettingMinutes} onChange={(e) => setBettingMinutes(e.target.value)} />
        </Field>
      </div>
      <Field label="Resolve delay after close (min)">
        <input
          className="input"
          value={resolveDelayMinutes}
          onChange={(e) => setResolveDelayMinutes(e.target.value)}
        />
      </Field>

      <button
        onClick={submit}
        disabled={submitting || !question || !oracleUrl}
        className="rounded border border-signal bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition hover:bg-signal/20 disabled:opacity-40"
      >
        {submitting ? "Creating\u2026" : "Create market"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block font-mono text-[11px] text-fog">{label}</label>
      {children}
    </div>
  );
}

function MarketCard({
  market,
  account,
  stakes,
  onChanged,
  onError,
  onNeedAccount,
}: {
  market: Market;
  account: `0x${string}` | null;
  stakes?: Stakes;
  onChanged: () => void;
  onError: (msg: string) => void;
  onNeedAccount: () => void;
}) {
  const [amount, setAmount] = useState("0.01");
  const [busy, setBusy] = useState<"yes" | "no" | "claim" | "refund" | null>(null);

  const total = market.totalYes + market.totalNo;
  const yesPct = total === 0n ? 50 : Number((market.totalYes * 100n) / total);

  async function bet(isYes: boolean) {
    if (!account) return onNeedAccount();
    setBusy(isYes ? "yes" : "no");
    try {
      await placeBet(account, market.id, isYes, amount);
      onChanged();
    } catch (e: any) {
      onError(e?.message || "Bet failed.");
    } finally {
      setBusy(null);
    }
  }

  async function claim() {
    if (!account) return;
    setBusy("claim");
    try {
      await claimWinnings(account, market.id);
      onChanged();
    } catch (e: any) {
      onError(e?.message || "Claim failed.");
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!account) return;
    setBusy("refund");
    try {
      await claimRefund(account, market.id);
      onChanged();
    } catch (e: any) {
      onError(e?.message || "Refund failed.");
    } finally {
      setBusy(null);
    }
  }

  const canBet = market.state === MarketState.Open;
  const canClaim =
    market.state === MarketState.Resolved && stakes && !stakes.alreadySettled && stakes.claimable > 0n;
  const canRefund = market.state === MarketState.Invalid && stakes && !stakes.alreadySettled;

  return (
    <div className="rounded border border-line border-t-2 border-t-signal/60 bg-white/[0.02] p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="font-display text-lg font-semibold leading-snug text-paper">{market.question}</p>
        <span className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-wide ${stateColor[market.state]}`}>
          {stateLabel[market.state]}
        </span>
      </div>

      <p className="mb-3.5 font-mono text-xs text-fog">
        target {comparatorLabel[market.comparator]} {market.target.toString()} &middot; {market.jsonPath} @ {market.oracleUrl}
      </p>

      <div className="mb-2 flex h-2 overflow-hidden rounded">
        <div className="bg-signal" style={{ width: `${yesPct}%` }} />
        <div className="bg-red-400/70" style={{ width: `${100 - yesPct}%` }} />
      </div>
      <div className="mb-4 flex justify-between text-xs text-fog tabular">
        <span>Yes {formatEther(market.totalYes)} RITUAL</span>
        <span>No {formatEther(market.totalNo)} RITUAL</span>
      </div>

      {canBet && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-24"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={() => bet(true)}
            disabled={busy !== null}
            className="rounded border border-signal px-3.5 py-2 text-sm text-signal transition hover:bg-signal/10 disabled:opacity-40"
          >
            {busy === "yes" ? "Betting\u2026" : "Bet Yes"}
          </button>
          <button
            onClick={() => bet(false)}
            disabled={busy !== null}
            className="rounded border border-red-400/60 px-3.5 py-2 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
          >
            {busy === "no" ? "Betting\u2026" : "Bet No"}
          </button>
        </div>
      )}

      {canClaim && (
        <button
          onClick={claim}
          disabled={busy !== null}
          className="rounded border border-signal bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition hover:bg-signal/20 disabled:opacity-40"
        >
          {busy === "claim" ? "Claiming\u2026" : `Claim ${formatEther(stakes!.claimable)} RITUAL`}
        </button>
      )}

      {canRefund && (
        <button
          onClick={refund}
          disabled={busy !== null}
          className="rounded border border-line px-4 py-2 text-sm text-paper transition hover:border-signal disabled:opacity-40"
        >
          {busy === "refund" ? "Refunding\u2026" : "Claim refund"}
        </button>
      )}

      {market.state === MarketState.Resolved && (
        <p className="mt-3 text-xs text-fog">
          Outcome: {Outcome[market.outcome]} &middot; observed {market.observedValue.toString()}
        </p>
      )}
      {market.state === MarketState.Invalid && market.invalidReason && (
        <p className="mt-3 text-xs text-red-300">{market.invalidReason}</p>
      )}
    </div>
  );
}
