# RitualPredict

An on-chain, pari-mutuel prediction market resolved entirely by Ritual's native async precompiles — no off-chain keeper, no centralized oracle relayer. Market resolution is scheduled on-chain, executed inside a TEE, fetched over HTTP, and parsed with `jq`, all via precompile calls.

Built and tested as part of the [Ritual Chain Workshop](https://github.com/Isaiah-54/ritual-chain-workshop-2).

---

## Overview

RitualPredict lets anyone create a binary (YES/NO) prediction market tied to a numeric value pulled from any HTTP JSON endpoint (e.g. "Will ETH price be above $3000?"). Bettors stake ETH on YES or NO during a betting window. Once betting closes, the contract **schedules its own resolution** using Ritual's on-chain `Scheduler` precompile — no human or bot needs to call it. At the scheduled block, the Scheduler invokes the contract, which calls the `HTTP` precompile to fetch the oracle URL, pipes the response through the `JQ` precompile to extract the target value, compares it against the market's target using the configured comparator, and settles the market. Winners then claim their share of the pari-mutuel pool.

### Why this is interesting

- **Fully on-chain resolution loop.** Scheduler → HTTP → JQ → settlement, with zero off-chain infrastructure.
- **Self-healing retries.** If the HTTP fetch or JQ parse fails (bad response, malformed JSON, non-2xx status), the contract records the failed attempt and the Scheduler retries automatically, up to a max attempt count, before the market is marked invalid and stakes are refunded.
- **TEE-backed execution.** Oracle fetches run inside a Trusted Execution Environment, verified via the TEE executor address.

---

## Architecture / Flow

```
┌─────────────┐      1. createMarket()       ┌──────────────────┐
│   Creator   │ ────────────────────────────▶│   RitualPredict   │
└─────────────┘   question, oracleUrl,        │      Contract      │
                   jsonPath, target,          └─────────┬──────────┘
                   comparator, blocks                   │
                                                          │ 2. schedules self-callback
                                                          ▼
┌─────────────┐      3. bet(YES/NO)          ┌──────────────────┐
│  Bettors    │ ────────────────────────────▶│   Betting Pool     │
└─────────────┘   (stake ETH, before close)  │  totalYes/totalNo  │
                                                └─────────┬──────────┘
                                                          │ betting window closes
                                                          ▼
                                              ┌──────────────────┐
                                              │  Scheduler        │  4. onScheduledResolve()
                                              │  (0x08xx)          │─────────────┐
                                              └──────────────────┘             │
                                                                                 ▼
                                              ┌──────────────────┐   5. HTTP precompile (0x0801)
                                              │  TEE Executor     │──▶ fetch(oracleUrl)
                                              └──────────────────┘             │
                                                                                 ▼
                                              ┌──────────────────┐   6. JQ precompile (0x0803)
                                              │  jq engine         │──▶ parse(body, jsonPath)
                                              └──────────────────┘             │
                                                                                 ▼
                                              7. compare(observedValue, target, comparator)
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    ▼                     ▼                     ▼
                              state = RESOLVED      attempt failed        max attempts hit
                              outcome = YES/NO       → retry scheduled     → state = INVALID
                                    │                                             │
                                    ▼                                             ▼
                        8. claimWinnings()                          8. claimRefund()
                        winners split the pool                       everyone refunded
```

### Market lifecycle (state machine)

| State | Meaning |
|---|---|
| `Open` | Betting window active, bets accepted |
| `Closed` | Betting window ended, awaiting resolution |
| `Resolved` | Oracle value fetched and compared successfully |
| `Invalid` | Max resolution attempts exhausted — stakes refunded |

### Comparators supported

- `GT` — observed value strictly greater than target
- `GTE` — observed value greater than or equal to target
- `LT` — observed value strictly less than target
- `LTE` — observed value less than or equal to target

---

## Core Contract Functions

| Function | Description |
|---|---|
| `createMarket(question, oracleUrl, jsonPath, target, comparator, closeBlock, resolveBlock)` | Opens a new market and schedules its resolution via the Scheduler precompile |
| `bet(marketId, side)` | Stake ETH on YES or NO before the betting window closes |
| `onScheduledResolve(marketId, attempt)` | Scheduler-only callback: runs the HTTP → JQ → compare pipeline |
| `stakesOf(marketId, account)` | Returns a bettor's yes/no stake, claimed status, and claimable amount |
| `claimWinnings(marketId)` | Winning side claims its pro-rata share of the full pool |
| `claimRefund(marketId)` | Refund path when a market resolves as `Invalid` |
| `getMarkets()` | Returns all markets, newest first |

### Precompiles used

| Address | Purpose |
|---|---|
| `0x0801` | HTTP fetch (returns status code, body, error string) |
| `0x0803` | JQ JSON parsing/extraction |
| `0x0000000000000000000000000000000000000001` | TEE executor identity, used to verify oracle calls ran in-TEE |
| Scheduler | Native on-chain cron-style callback scheduling |

---

## Failure Handling

Every step in the resolution pipeline can fail without reverting the whole callback:

- **HTTP failure** — non-2xx status, malformed response, empty body, or precompile-level error → attempt recorded, Scheduler retries
- **JQ failure** — path doesn't resolve against the response body → attempt recorded, Scheduler retries
- **Max attempts exceeded** — market flips to `Invalid`, all stakes become refundable via `claimRefund`

This means a single bad oracle response never bricks a market or traps user funds.

---

## Test Suite

52 Solidity tests + 22 Node.js integration tests, 74 total, all passing:

```bash
cd hardhat
npx hardhat test
```

Coverage includes:
- Full end-to-end flow: Scheduler → TEE → HTTP → jq → settlement (with real ABI-encoded precompile mock responses)
- Market creation validation (empty question/URL/path, zero block time, betting/resolution delay minimums)
- Betting edge cases (zero-value bets, betting after close)
- Resolution outcomes for all four comparators (GT, GTE, LT, LTE)
- Multiple failed attempts before eventual success or invalidation
- Double-claim and double-refund protection
- Pari-mutuel payout correctness for both YES and NO winning sides
- Scheduler callback authorization (only the Scheduler can trigger resolution)
- Scheduler retry cancellation after a successful resolution

Example run output (abbreviated):

```
Market created: "Will the oracle price be above 3000?"
Observed oracle value: 3500
Final state: Resolved, outcome: YES
YES claimable: 2.0 ETH (full pool from 1 ETH YES + 1 ETH NO)
74 passing (52 solidity, 22 nodejs)
```

---

## Project Structure

```
ritual-chain-workshop-2/
├── hardhat/
│   ├── contracts/
│   │   └── RitualPredict.sol       # Core prediction market contract
│   ├── test/
│   │   └── RitualPredict.t.sol     # Solidity test suite
│   ├── test-node/                  # Node.js integration tests (precompile mocking, full flow)
│   └── hardhat.config.*
└── README.md
```

---

## Getting Started

```bash
git clone https://github.com/Isaiah-54/ritual-chain-workshop-2.git
cd ritual-chain-workshop-2/hardhat
npm install
npx hardhat test
```

---

## License

MIT
