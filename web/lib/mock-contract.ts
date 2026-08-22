import { Comparator, Market, MarketState, Outcome, Stakes } from "./types";

function fakeAddr(seed: number): `0x${string}` {
  return `0x${seed.toString(16).padStart(40, "0")}` as `0x${string}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const eth = (n: number) => BigInt(Math.round(n * 1e18));

// In-memory demo markets. Same shape as the real on-chain Market struct.
let markets: Market[] = [
  {
    id: 1n,
    creator: fakeAddr(1),
    question: "Will ETH close above $4,000 by Friday?",
    oracleUrl: "https://api.example.com/eth-price",
    jsonPath: "price",
    target: 4000n,
    comparator: Comparator.GTE,
    closeBlock: 128400n,
    resolveBlock: 128520n,
    scheduleId: 1n,
    totalYes: eth(3.4),
    totalNo: eth(1.9),
    state: MarketState.Open,
    outcome: Outcome.Unresolved,
    attempts: 0,
    observedValue: 0n,
    invalidReason: "",
  },
  {
    id: 2n,
    creator: fakeAddr(2),
    question: "Will the testnet stay up through the workshop?",
    oracleUrl: "https://status.ritualfoundation.org/uptime",
    jsonPath: "uptimePct",
    target: 95n,
    comparator: Comparator.GTE,
    closeBlock: 128000n,
    resolveBlock: 128100n,
    scheduleId: 2n,
    totalYes: eth(0.8),
    totalNo: eth(2.6),
    state: MarketState.Resolved,
    outcome: Outcome.No,
    attempts: 1,
    observedValue: 41n,
    invalidReason: "",
  },
  {
    id: 3n,
    creator: fakeAddr(3),
    question: "Will BTC dominance exceed 60%?",
    oracleUrl: "https://api.example.com/btc-dominance",
    jsonPath: "dominance",
    target: 60n,
    comparator: Comparator.GT,
    closeBlock: 127500n,
    resolveBlock: 127600n,
    scheduleId: 3n,
    totalYes: eth(1.1),
    totalNo: eth(1.1),
    state: MarketState.Invalid,
    outcome: Outcome.Unresolved,
    attempts: 3,
    observedValue: 0n,
    invalidReason: "Oracle endpoint unreachable after max retries.",
  },
];

const stakesStore: Record<string, Stakes> = {};
const key = (marketId: bigint, account: string) => `${marketId}-${account.toLowerCase()}`;

export async function getMarkets(): Promise<Market[]> {
  await delay(350);
  return markets.map((m) => ({ ...m }));
}

export async function getMarket(marketId: bigint): Promise<Market> {
  await delay(200);
  const m = markets.find((m) => m.id === marketId);
  if (!m) throw new Error("Market not found.");
  return { ...m };
}

export async function getStakes(marketId: bigint, account: `0x${string}`): Promise<Stakes> {
  await delay(150);
  return (
    stakesStore[key(marketId, account)] ?? {
      yes: 0n,
      no: 0n,
      alreadySettled: false,
      claimable: 0n,
    }
  );
}

export async function connectWallet(): Promise<`0x${string}`> {
  const injected = (window as any).ethereum;
  if (injected) {
    try {
      const accounts: string[] = await injected.request({ method: "eth_requestAccounts" });
      if (accounts?.length) return accounts[0] as `0x${string}`;
    } catch {
      // fall through to demo account
    }
  }
  return fakeAddr(Math.floor(Math.random() * 0xffffff) + 100);
}

export async function placeBet(
  account: `0x${string}`,
  marketId: bigint,
  isYes: boolean,
  amountEther: string
) {
  await delay(700);
  const amount = eth(parseFloat(amountEther || "0"));
  const m = markets.find((m) => m.id === marketId);
  if (!m) throw new Error("Market not found.");
  if (m.state !== MarketState.Open) throw new Error("Betting is closed for this market.");
  if (isYes) m.totalYes += amount;
  else m.totalNo += amount;

  const k = key(marketId, account);
  const s = stakesStore[k] ?? { yes: 0n, no: 0n, alreadySettled: false, claimable: 0n };
  if (isYes) s.yes += amount;
  else s.no += amount;
  stakesStore[k] = s;
}

export async function claimWinnings(account: `0x${string}`, marketId: bigint) {
  await delay(600);
  const k = key(marketId, account);
  const s = stakesStore[k];
  if (!s || s.alreadySettled || s.claimable === 0n) throw new Error("Nothing to claim.");
  s.alreadySettled = true;
  s.claimable = 0n;
}

export async function claimRefund(account: `0x${string}`, marketId: bigint) {
  await delay(600);
  const k = key(marketId, account);
  const s = stakesStore[k] ?? { yes: 0n, no: 0n, alreadySettled: false, claimable: 0n };
  if (s.alreadySettled) throw new Error("Already settled.");
  s.alreadySettled = true;
  stakesStore[k] = s;
}

export async function createMarket(
  _account: `0x${string}`,
  params: {
    question: string;
    oracleUrl: string;
    jsonPath: string;
    target: bigint;
    comparator: Comparator;
    bettingSeconds: bigint;
    resolveDelaySeconds: bigint;
  }
) {
  await delay(700);
  const id = BigInt(markets.length + 1);
  markets = [
    ...markets,
    {
      id,
      creator: fakeAddr(1),
      question: params.question,
      oracleUrl: params.oracleUrl,
      jsonPath: params.jsonPath,
      target: params.target,
      comparator: params.comparator,
      closeBlock: 0n,
      resolveBlock: 0n,
      scheduleId: id,
      totalYes: 0n,
      totalNo: 0n,
      state: MarketState.Open,
      outcome: Outcome.Unresolved,
      attempts: 0,
      observedValue: 0n,
      invalidReason: "",
    },
  ];
  return id;
}
