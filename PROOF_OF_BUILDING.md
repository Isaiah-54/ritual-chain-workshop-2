# Proof of Building — Ritual Academy Bootcamp 2

**Repository:** https://github.com/Isaiah-54/ritual-chain-workshop-2  
**Upstream:** https://github.com/cozfuttu/ritual-chain-workshop-2  
**Submission Type:** Public GitHub fork with original work  

---

## 1. Summary

I completed the Ritual Academy Bootcamp 2 workshop by building a fully functional **self-resolving binary prediction market** (RitualPredict) on Ritual Chain.

The market:
- Accepts YES/NO bets in native tokens
- Schedules its own resolution using the native **Scheduler**
- Fetches external data via the **HTTP precompile (0x0801)**
- Parses the response with the **JQ precompile (0x0803)**
- Settles automatically with retries and proper invalidation/refund logic
- Requires **zero off-chain keepers or backends**

---

## 2. What Was Implemented

### Smart Contract (`hardhat/contracts/RitualPredict.sol`)
- Complete market lifecycle: `Open → Closed → Resolving → Resolved / Invalid`
- Support for all four comparators (GT, GTE, LT, LTE)
- Self-scheduling of resolution via Ritual Scheduler
- Robust failure handling with automatic retries (max 3 attempts)
- Empty winning side protection → market becomes Invalid + refunds
- Proper TEE executor selection and authorization checks
- Clean events and custom errors

### Testing
- **74 passing tests** total:
  - 52 Solidity unit tests
  - 22 Node.js integration tests
- Coverage includes:
  - Full end-to-end resolution flow (Scheduler → HTTP → JQ → settlement)
  - All comparators
  - Retry logic and max attempts
  - Double-claim / double-refund protection
  - Edge cases (zero bets, betting after close, empty pools, etc.)
  - Authorization (only Scheduler can trigger resolution)

### Frontend
- Next.js frontend with iterative improvements
- Market creation, betting, claiming
- Live status indicators and pool visualization
- Deployed demo available at:  
  `https://ritual-chain-workshop-2-njyc-inky.vercel.app/`

### Documentation
- Detailed README with architecture diagram and state machine
- Clear explanation of Ritual-native primitives used
- TESTING.md documenting the full test suite

---

## 3. Original Work Beyond the Starter

- Fully implemented and hardened the resolution pipeline
- Comprehensive test suite (far beyond basic coverage)
- Professional frontend with multiple UI iterations
- Clear documentation focused on Ritual-specific features (Scheduler, HTTP, JQ, TEE)
- Local testing infrastructure with mocks so everything runs offline

---

## 4. How to Verify

```bash
# Clone
git clone https://github.com/Isaiah-54/ritual-chain-workshop-2.git
cd ritual-chain-workshop-2/hardhat

# Install & Test
npm install   # or pnpm install
npx hardhat test
