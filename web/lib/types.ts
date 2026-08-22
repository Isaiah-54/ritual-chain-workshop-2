export enum MarketState {
  Open = 0,
  Closed = 1,
  Resolving = 2,
  Resolved = 3,
  Invalid = 4,
}

export enum Outcome {
  Unresolved = 0,
  Yes = 1,
  No = 2,
}

export enum Comparator {
  GT = 0,
  GTE = 1,
  LT = 2,
  LTE = 3,
}

export const comparatorLabel: Record<Comparator, string> = {
  [Comparator.GT]: ">",
  [Comparator.GTE]: "\u2265",
  [Comparator.LT]: "<",
  [Comparator.LTE]: "\u2264",
};

export interface Market {
  id: bigint;
  creator: `0x${string}`;
  question: string;
  oracleUrl: string;
  jsonPath: string;
  target: bigint;
  comparator: Comparator;
  closeBlock: bigint;
  resolveBlock: bigint;
  scheduleId: bigint;
  totalYes: bigint;
  totalNo: bigint;
  state: MarketState;
  outcome: Outcome;
  attempts: number;
  observedValue: bigint;
  invalidReason: string;
}

export interface NewMarketInput {
  question: string;
  oracleUrl: string;
  jsonPath: string;
  target: bigint;
  comparator: Comparator;
  bettingSeconds: bigint;
  resolveDelaySeconds: bigint;
}

export interface Stakes {
  yes: bigint;
  no: bigint;
  alreadySettled: boolean;
  claimable: bigint;
}

// getMarket / getMarkets come back from viem as an array-like tuple with
// named keys attached (since the ABI struct components are named). This
// normalizes either shape into a typed Market.
export function toMarket(raw: any): Market {
  return {
    id: BigInt(raw.id),
    creator: raw.creator,
    question: raw.question,
    oracleUrl: raw.oracleUrl,
    jsonPath: raw.jsonPath,
    target: BigInt(raw.target),
    comparator: Number(raw.comparator) as Comparator,
    closeBlock: BigInt(raw.closeBlock),
    resolveBlock: BigInt(raw.resolveBlock),
    scheduleId: BigInt(raw.scheduleId),
    totalYes: BigInt(raw.totalYes),
    totalNo: BigInt(raw.totalNo),
    state: Number(raw.state) as MarketState,
    outcome: Number(raw.outcome) as Outcome,
    attempts: Number(raw.attempts),
    observedValue: BigInt(raw.observedValue),
    invalidReason: raw.invalidReason,
  };
}
