export type MarketState = "Open" | "Closed" | "Resolving" | "Resolved" | "Invalid";
export type Comparator = "GT" | "GTE" | "LT" | "LTE";
export type Outcome = "Unresolved" | "Yes" | "No";

export type Market = {
  id: number;
  question: string;
  category: string;
  oracleUrl: string;
  jsonPath: string;
  target: number;
  comparator: Comparator;
  totalYes: number;
  totalNo: number;
  state: MarketState;
  outcome: Outcome;
  attempts: number;
  maxAttempts: number;
  observedValue: number | null;
  invalidReason: string | null;
  closeInLabel: string;
};

export const PIPELINE = [
  { id: "sched", label: "Scheduler", detail: "Fires at resolveBlock · up to 3 attempts, 200 blocks apart" },
  { id: "tee", label: "TEE Registry", detail: "pickServiceByCapability(HTTP_CALL) · no hardcoded executor" },
  { id: "http", label: "HTTP 0x0801", detail: "GET oracleUrl inside TEE · short-running async envelope" },
  { id: "jq", label: "jq 0x0803", detail: "jsonPath → uint256 · synchronous precompile" },
  { id: "cmp", label: "Comparator", detail: "GT · GTE · LT · LTE against immutable target" },
  { id: "settle", label: "Settlement", detail: "Resolved → claimWinnings · Invalid → claimRefund · cancel retries" },
] as const;

export const PROOF = {
  solidity: 52,
  typescript: 22,
  total: 74,
  github: "https://github.com/Isaiah-54/ritual-chain-workshop-2",
  banner:
    "Ritual testnet RPC is offline · this UI is a faithful local simulation of the verified contract",
};

export function compare(observed: number, target: number, c: Comparator): boolean {
  if (c === "GT") return observed > target;
  if (c === "GTE") return observed >= target;
  if (c === "LT") return observed < target;
  return observed <= target;
}

export function impliedYes(m: Market): number {
  const t = m.totalYes + m.totalNo;
  if (t === 0) return 50;
  return Math.round((m.totalYes / t) * 100);
}

export const MARKETS: Market[] = [
  {
    id: 1,
    question: "Will ETH/USD be at least $4,000?",
    category: "Crypto",
    oracleUrl: "https://api.example.com/eth/usd",
    jsonPath: ".price",
    target: 4000,
    comparator: "GTE",
    totalYes: 1.2,
    totalNo: 0.8,
    state: "Resolved",
    outcome: "Yes",
    attempts: 1,
    maxAttempts: 3,
    observedValue: 4126,
    invalidReason: null,
    closeInLabel: "Resolved",
  },
  {
    id: 2,
    question: "Will oracle price be above $3,000?",
    category: "Demo",
    oracleUrl: "https://example.com/price.json",
    jsonPath: ".price",
    target: 3000,
    comparator: "GT",
    totalYes: 1,
    totalNo: 1,
    state: "Resolved",
    outcome: "Yes",
    attempts: 1,
    maxAttempts: 3,
    observedValue: 3500,
    invalidReason: null,
    closeInLabel: "Resolved",
  },
  {
    id: 3,
    question: "Will price be greater than $4,000? (NO path)",
    category: "Demo",
    oracleUrl: "https://example.com/price.json",
    jsonPath: ".price",
    target: 4000,
    comparator: "GT",
    totalYes: 1,
    totalNo: 2,
    state: "Resolved",
    outcome: "No",
    attempts: 1,
    maxAttempts: 3,
    observedValue: 3500,
    invalidReason: null,
    closeInLabel: "Resolved",
  },
  {
    id: 4,
    question: "Will ETH gas stay under 20 gwei?",
    category: "Network",
    oracleUrl: "https://api.example.com/gas",
    jsonPath: ".gwei",
    target: 20,
    comparator: "LT",
    totalYes: 0.6,
    totalNo: 0.4,
    state: "Open",
    outcome: "Unresolved",
    attempts: 0,
    maxAttempts: 3,
    observedValue: null,
    invalidReason: null,
    closeInLabel: "~2h",
  },
  {
    id: 5,
    question: "Oracle failure after 3 attempts",
    category: "Edge case",
    oracleUrl: "https://example.com/down",
    jsonPath: ".price",
    target: 3000,
    comparator: "GT",
    totalYes: 0.5,
    totalNo: 0.5,
    state: "Invalid",
    outcome: "Unresolved",
    attempts: 3,
    maxAttempts: 3,
    observedValue: null,
    invalidReason: "HTTP precompile call failed",
    closeInLabel: "Invalid · refunds",
  },
  {
    id: 6,
    question: "YES wins but no YES stakes",
    category: "Edge case",
    oracleUrl: "https://example.com/price.json",
    jsonPath: ".price",
    target: 3000,
    comparator: "GT",
    totalYes: 0,
    totalNo: 1,
    state: "Invalid",
    outcome: "Yes",
    attempts: 1,
    maxAttempts: 3,
    observedValue: 3500,
    invalidReason: "no YES winners",
    closeInLabel: "Invalid · refunds",
  },
];
