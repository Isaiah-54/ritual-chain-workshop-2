import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseEther,
} from "viem";
import { predictAbi } from "./predict-abi";
import { Comparator, Market, Stakes, toMarket } from "./types";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ritualfoundation.org";
const CHAIN_ID_HEX = process.env.NEXT_PUBLIC_CHAIN_ID_HEX || "0x7BB";
const CHAIN_NAME = process.env.NEXT_PUBLIC_CHAIN_NAME || "Ritual Chain";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const ritualChain = defineChain({
  id: parseInt(CHAIN_ID_HEX, 16),
  name: CHAIN_NAME,
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

export const predictContract = {
  address: CONTRACT_ADDRESS,
  abi: predictAbi,
} as const;

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(RPC_URL),
});

function getEthereum(): any {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No wallet found. Install MetaMask or another injected wallet.");
  }
  return (window as any).ethereum;
}

export function getWalletClient(account?: `0x${string}`) {
  return createWalletClient({
    chain: ritualChain,
    transport: custom(getEthereum()),
    account,
  });
}

export async function connectWallet(): Promise<`0x${string}`> {
  const eth = getEthereum();
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("No account returned by wallet.");
  await ensureRitualChain();
  return accounts[0] as `0x${string}`;
}

export async function ensureRitualChain() {
  const eth = getEthereum();
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: CHAIN_NAME,
            nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
            rpcUrls: [RPC_URL],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

// ---------- reads ----------

export async function getMarkets(): Promise<Market[]> {
  const raw = (await publicClient.readContract({
    ...predictContract,
    functionName: "getMarkets",
  })) as any[];
  return raw.map(toMarket);
}

export async function getMarket(marketId: bigint): Promise<Market> {
  const raw = await publicClient.readContract({
    ...predictContract,
    functionName: "getMarket",
    args: [marketId],
  });
  return toMarket(raw);
}

export async function getStakes(marketId: bigint, account: `0x${string}`): Promise<Stakes> {
  const [yes, no, alreadySettled, claimable] = (await publicClient.readContract({
    ...predictContract,
    functionName: "stakesOf",
    args: [marketId, account],
  })) as [bigint, bigint, boolean, bigint];
  return { yes, no, alreadySettled, claimable };
}

// ---------- writes ----------

export async function placeBet(
  account: `0x${string}`,
  marketId: bigint,
  isYes: boolean,
  amountEther: string
) {
  const wallet = getWalletClient(account);
  return wallet.writeContract({
    ...predictContract,
    functionName: "bet",
    args: [marketId, isYes],
    value: parseEther(amountEther),
  });
}

export async function claimWinnings(account: `0x${string}`, marketId: bigint) {
  const wallet = getWalletClient(account);
  return wallet.writeContract({
    ...predictContract,
    functionName: "claimWinnings",
    args: [marketId],
  });
}

export async function claimRefund(account: `0x${string}`, marketId: bigint) {
  const wallet = getWalletClient(account);
  return wallet.writeContract({
    ...predictContract,
    functionName: "claimRefund",
    args: [marketId],
  });
}

export async function createMarket(
  account: `0x${string}`,
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
  const wallet = getWalletClient(account);
  return wallet.writeContract({
    ...predictContract,
    functionName: "createMarket",
    args: [params],
  });
}
