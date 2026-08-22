# RitualPredict — Web

A minimal frontend for the RitualPredict self-resolving prediction market: create markets, bet YES/NO, watch resolution, claim winnings or refunds. Next.js 14 (App Router) + TypeScript + Tailwind + ethers v6, no wallet-connect SDK — just an injected wallet (MetaMask or similar) via `window.ethereum`.

## Before you run this

Three things in this scaffold are placeholders and need your real values:

1. **`lib/abi.ts`** — replace `RITUAL_PREDICT_ABI` with the real ABI from `hardhat/artifacts/contracts/RitualPredict.sol/RitualPredict.json` (the `"abi"` field). The version here is reconstructed from your test output and may not match your contract's exact function signatures, especially `createMarket`'s parameter order and the comparator enum's numeric values.
2. **`.env.local`** — your deployed contract address and RPC URL (see below).
3. **Comparator mapping** in `lib/abi.ts` (`COMPARATOR`) — confirm `GT`/`GTE`/`LT`/`LTE` map to the right `uint8` values in your Solidity enum.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
# edit .env.local with your contract address + RPC URL
npm run dev
```

Visit `http://localhost:3000`.

## Deploying to Vercel

The simplest path, matching a GitHub-first workflow:

1. Push this `web/` folder as part of your repo (see the root-level push instructions).
2. Go to [vercel.com/new](https://vercel.com/new) and import `Isaiah-54/ritual-chain-workshop-2`.
3. When Vercel asks for the **Root Directory**, set it to `web` (not the repo root — your `hardhat/` folder isn't a Next.js app).
4. Add the environment variables from `.env.local.example` under Project Settings → Environment Variables.
5. Deploy. Every subsequent `git push` to `main` redeploys automatically.

No Vercel CLI needed — this all happens through the Vercel dashboard once it's linked to your GitHub repo.

## What's implemented

- Wallet connect (injected provider), with automatic network add/switch if you set `NEXT_PUBLIC_CHAIN_ID_HEX`
- Live block-height ticker in the header, polled every 4s — since your contract's whole design hinges on block numbers rather than timestamps, this keeps that fact visible
- Market list, polled every 8s, with a YES/NO pool bar and a status indicator (pulsing while `Open`/`Closed`, solid once `Resolved`/`Invalid`)
- Create-market form
- Per-market bet form (YES/NO with an ETH/RITUAL amount)
- Stake display and claim-winnings / claim-refund actions, gated on the connected wallet's `stakesOf` result

## What's not implemented (kept intentionally minimal)

- No market detail page / routing — everything lives on one page
- No transaction history or toast queue — status is a single dismissable banner
- No indexer — market list comes straight from `getMarkets()`, so it's only as fresh as your RPC's latest block

