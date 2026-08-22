/**
 * ⚠️ REPLACE THIS FILE with the real ABI before deploying.
 *
 * After `npx hardhat compile` in your hardhat/ folder, the real ABI lives at:
 *   hardhat/artifacts/contracts/RitualPredict.sol/RitualPredict.json
 * under the "abi" key.
 *
 * Copy that array and paste it in place of RITUAL_PREDICT_ABI below.
 * The shape here is a best-effort reconstruction from your test output/README
 * so the app compiles and the UI has something to bind to — the exact
 * parameter order, names, and the comparator enum values need to be
 * confirmed against your actual RitualPredict.sol before this is trustworthy.
 */
export const RITUAL_PREDICT_ABI = [
  // --- Reads ---
  "function getMarkets() view returns (tuple(uint256 id, address creator, string question, string oracleUrl, string jsonPath, uint256 target, uint8 comparator, uint256 closeBlock, uint256 resolveBlock, uint256 scheduleId, uint256 totalYes, uint256 totalNo, uint8 state, uint8 outcome, uint256 attempts, uint256 observedValue, string invalidReason)[])",
  "function stakesOf(uint256 marketId, address account) view returns (uint256 yesStake, uint256 noStake, bool claimed, uint256 claimable)",

  // --- Writes ---
  // TODO: confirm exact param order/units (seconds vs blocks) against your contract.
  "function createMarket(string question, string oracleUrl, string jsonPath, uint256 target, uint8 comparator, uint256 bettingDurationSeconds, uint256 resolutionDelaySeconds) returns (uint256 marketId)",
  "function bet(uint256 marketId, uint8 side) payable",
  "function claimWinnings(uint256 marketId)",
  "function claimRefund(uint256 marketId)",

  // --- Events ---
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question)",
  "event BetPlaced(uint256 indexed marketId, address indexed account, uint8 side, uint256 amount)",
  "event ResolutionRuleSet(uint256 indexed marketId, string oracleUrl, string jsonPath, uint256 target, uint8 comparator, uint256 resolveBlock)",
] as const;

// Market state enum — order per your README's state machine.
export const MARKET_STATE = ["Open", "Closed", "Resolved", "Invalid"] as const;

// Comparator enum — TODO: confirm actual numeric values in RitualPredict.sol.
export const COMPARATOR = {
  GT: 0,
  GTE: 1,
  LT: 2,
  LTE: 3,
} as const;

export const COMPARATOR_LABEL: Record<number, string> = {
  0: ">",
  1: "\u2265",
  2: "<",
  3: "\u2264",
};

// Side enum for bet()
export const SIDE = { YES: 0, NO: 1 } as const;

