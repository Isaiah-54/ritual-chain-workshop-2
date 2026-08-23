import type { Comparator, Market } from "./protocol";
import { compare } from "./protocol";

export type LogLevel = "info" | "ok" | "warn" | "err";
export type ResolveLog = { t: string; level: LogLevel; msg: string };

export type ResolveResult = {
  logs: ResolveLog[];
  finalState: "Resolved" | "Invalid" | "Resolving";
  outcome: "Yes" | "No" | "Unresolved";
  observed: number | null;
  attempts: number;
};

function ts(offsetMs: number) {
  const d = new Date(Date.now() + offsetMs);
  return d.toISOString().slice(11, 23);
}

export function simulateResolution(
  market: Market,
  opts?: { forceFailAttempts?: number; observedOverride?: number },
): ResolveResult {
  const logs: ResolveLog[] = [];
  const max = market.maxAttempts || 3;
  const forceFail = opts?.forceFailAttempts ?? 0;
  const observed =
    opts?.observedOverride ??
    market.observedValue ??
    (market.comparator === "GT" || market.comparator === "GTE"
      ? market.target + 500
      : market.target - 500);

  logs.push({
    t: ts(0),
    level: "info",
    msg: `Scheduler: job for market #${market.id} queued at resolveBlock`,
  });

  for (let attempt = 1; attempt <= max; attempt++) {
    const base = attempt * 40;
    logs.push({
      t: ts(base),
      level: "info",
      msg: `── Attempt ${attempt}/${max} · onScheduledResolve(executionIndex=${attempt - 1})`,
    });
    logs.push({
      t: ts(base + 5),
      level: "info",
      msg: `TEE: pickServiceByCapability(HTTP_CALL) → executor 0x0000…0001`,
    });

    if (attempt <= forceFail) {
      logs.push({
        t: ts(base + 12),
        level: "err",
        msg: `HTTP 0x0801: call failed · ResolutionFailed (not interpreted as NO)`,
      });
      logs.push({
        t: ts(base + 15),
        level: "warn",
        msg: `attempts = ${attempt} · Resolving · retry in 200 blocks`,
      });
      if (attempt === max) {
        logs.push({
          t: ts(base + 20),
          level: "err",
          msg: `Max attempts → Invalid · claimRefund()`,
        });
        return {
          logs,
          finalState: "Invalid",
          outcome: "Unresolved",
          observed: null,
          attempts: max,
        };
      }
      continue;
    }

    logs.push({
      t: ts(base + 10),
      level: "ok",
      msg: `HTTP 0x0801: GET ${market.oracleUrl} · status 200`,
    });
    logs.push({
      t: ts(base + 14),
      level: "ok",
      msg: `jq 0x0803: ${market.jsonPath} → ${observed}`,
    });

    const yesWon = compare(observed, market.target, market.comparator as Comparator);
    logs.push({
      t: ts(base + 18),
      level: "info",
      msg: `Comparator: ${observed} ${market.comparator} ${market.target} → ${yesWon ? "TRUE (YES)" : "FALSE (NO)"}`,
    });

    const winPool = yesWon ? market.totalYes : market.totalNo;
    if (winPool <= 0) {
      logs.push({
        t: ts(base + 22),
        level: "err",
        msg: `Empty winning side → Invalid · refunds`,
      });
      return {
        logs,
        finalState: "Invalid",
        outcome: yesWon ? "Yes" : "No",
        observed,
        attempts: attempt,
      };
    }

    logs.push({
      t: ts(base + 22),
      level: "ok",
      msg: `MarketResolved · ${yesWon ? "YES" : "NO"} · observed=${observed}`,
    });
    logs.push({
      t: ts(base + 26),
      level: "ok",
      msg: `Scheduler.cancel(scheduleId) · remaining retries cancelled`,
    });
    logs.push({
      t: ts(base + 30),
      level: "info",
      msg: `claimWinnings() available · pari-mutuel pull payout`,
    });

    return {
      logs,
      finalState: "Resolved",
      outcome: yesWon ? "Yes" : "No",
      observed,
      attempts: attempt,
    };
  }

  return {
    logs,
    finalState: "Invalid",
    outcome: "Unresolved",
    observed: null,
    attempts: max,
  };
}
