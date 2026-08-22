# Testing

RitualPredict is covered by **74 passing tests** — 52 Solidity tests (Forge-style, run through Hardhat) and 22 Node.js integration tests exercising the full on-chain resolution pipeline against mocked precompiles.

```bash
cd hardhat
npx hardhat test
```

Expected output ends with:

```
74 passing (52 solidity, 22 nodejs)
```

---

## What's actually being tested

### 1. Full end-to-end resolution flow (Node.js integration)

The core integration test drives the entire self-resolution loop against realistic mocked precompile responses, not just unit-level assertions:

- Deploys the contract, installs mock bytecode at the Scheduler, HTTP (`0x0801`), and JQ (`0x0803`) precompile addresses, and confirms the TEE executor address is wired correctly
- Creates a market ("Will the oracle price be above 3000?"), places YES and NO bets, and inspects `stakesOf` before resolution
- Mines forward to the scheduled resolution block and lets the Scheduler fire the callback
- Verifies the raw ABI-encoded HTTP response (`200`, JSON body `{"price":3500}`) decodes correctly, and that the JQ precompile correctly extracts `3500` from the `.price` path
- Confirms the market settles to `Resolved` / outcome `YES`, `observedValue = 3500`
- Confirms the winning YES bettor's claimable balance reflects the full pari-mutuel pool (2x their stake, from 1 ETH YES + 1 ETH NO)
- Confirms `stakesOf` correctly flips `claimed = true` and claimable drops to `0` after `claimWinnings()`

This single test proves the Scheduler → TEE → HTTP → jq → settlement → claim path works end-to-end, not just in isolated pieces.

### 2. Market creation validation

- Rejects zero block time at deployment
- Rejects an empty question, empty oracle URL, or empty JSON path
- Rejects betting duration below the protocol minimum
- Rejects resolution delay below the protocol minimum
- Confirms a valid market correctly records its resolution rule (`oracleUrl`, `jsonPath`, `target`, `comparator`) and schedules resolution via the Scheduler

### 3. Betting

- Accepts YES and NO bets during the open window
- Rejects a zero-value bet
- Rejects bets placed after the betting window has closed

### 4. Resolution outcomes — all four comparators

- `GT` — YES when observed value is strictly greater than target
- `GTE` — YES when observed value is greater than or equal to target
- `LT` — YES when observed value is strictly less than target
- `LTE` — NO when observed value is above target (inverse case covered)

### 5. Oracle failure handling

Every failure mode in the HTTP → jq pipeline is tested independently, confirming a bad response records a failed attempt rather than reverting or silently resolving:

- HTTP precompile-level failure (call itself fails)
- Non-2xx HTTP status code
- Malformed HTTP response envelope
- HTTP error message present in the response
- Empty HTTP response body
- JQ parse failure on the returned body
- Multiple consecutive failed attempts across scheduled retries
- No executor available for the request

### 6. Scheduler integration

- Records the Scheduler parameters correctly at market creation
- Confirms only the Scheduler can invoke `onScheduledResolve`
- Confirms the callback is a no-op if called again after the market is already resolved
- Confirms attempts beyond the configured max are ignored
- Confirms a call before the betting window has closed is ignored
- Confirms remaining scheduled retries are cancelled after a successful resolution

### 7. Payouts and edge cases

- Winning YES bettor claims the full pool
- Winning NO bettor claims the full pool
- A market with no winners on either side (invalid outcome) is marked `Invalid` and refunds are enabled
- Double-claim on `claimWinnings` reverts
- Double-refund on `claimRefund` reverts
- `claimWinnings` reverts if the market isn't yet resolved
- `claimRefund` reverts if the market isn't `Invalid`
- `claimRefund` reverts if there's nothing to claim
- Precompile mock sanity check — confirms the raw ABI-encoded bytes installed at `0x0801` and `0x0803` decode to the expected HTTP status/body and jq output before any contract logic runs on top of them

### 8. Protocol invariants

- Exposes the expected protocol constants (minimum betting duration, minimum resolution delay, etc.)
- `getMarkets()` returns markets newest-first

---

## Why this matters for correctness

The failure-mode tests (section 5) are the ones worth calling out specifically: a self-resolving oracle contract is only as trustworthy as its behavior when the oracle *doesn't* cooperate. RitualPredict never treats a failed fetch or a failed parse as a `NO` outcome — every failure path is tested to confirm it records an attempt and lets the Scheduler retry, only falling through to `Invalid` (full refunds) after the max attempt count is exhausted. That distinction is what stops a flaky HTTP endpoint from silently deciding a market's outcome.

## Running a single test file

```bash
cd hardhat
npx hardhat test test/RitualPredict.t.sol       # Solidity suite only
npx hardhat test test-node/oracle-flow.test.ts   # Node integration suite only
```

(Adjust paths to match your actual file names if they differ.)
