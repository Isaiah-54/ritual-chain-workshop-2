# Ritual Predict — Ritual Chain Prediction Market

A prediction-market smart contract built for the Ritual Chain, based on the original [Ritual Chain Workshop](https://github.com/cozfuttu/ritual-chain-workshop-2).

This repository extends the original workshop with an expanded `RitualPredict` contract, additional resolution and failure handling, Scheduler/TEE/HTTP/jq mocks, execution-funding support, and extensive Solidity and TypeScript test coverage.

## Project Status

**Local test suite: PASSING**

- 52 Solidity tests passing
- 22 Node.js/TypeScript tests passing
- **74 tests passing in total**
- Solidity version: `0.8.28`
- EVM target: `cancun`
- Hardhat 3.x

Latest complete local test result:

```text
74 passing (52 solidity, 22 nodejs)
