import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";

const SCHEDULER =
  "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B";
const TEE_SERVICE_REGISTRY =
  "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";

describe("RitualPredict", function () {
  async function deploy() {
    const { viem } = await hre.network.getOrCreate();
    const client = await viem.getPublicClient();


    // Deploy the mock scheduler and copy its runtime bytecode
    // to Ritual's canonical Scheduler address.
    const mock = await viem.deployContract("MockScheduler");

    const code = await client.getCode({
      address: mock.address,
    });

    if (!code) {
      throw new Error("Mock Scheduler has no runtime bytecode");
    }

    await client.request({
      method: "hardhat_setCode" as never,
      params: [SCHEDULER, code] as never,
    });

    // hardhat_setCode copies runtime bytecode only; it does not copy
    // storage. Initialize MockScheduler.nextCallId = 1 at the
    // canonical Scheduler address.
    await client.request({
      method: "hardhat_setStorageAt" as never,
      params: [
        SCHEDULER,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ] as never,
    });

    // Deploy the mock TEE registry and copy its runtime bytecode
    // to Ritual's canonical TEE Service Registry address.
    const mockRegistry = await viem.deployContract("MockTEERegistry");
    const registryCode = await client.getCode({
      address: mockRegistry.address,
    });
    if (!registryCode) {
      throw new Error("Mock TEE Registry has no runtime bytecode");
    }
    await client.request({
      method: "hardhat_setCode" as never,
      params: [TEE_SERVICE_REGISTRY, registryCode] as never,
    });

    const [owner, alice, bob] = await viem.getWalletClients();
    const factory = await viem.deployContract("RitualPredict", [195n]);

    return {
      viem,
      factory,
      owner,
      alice,
      bob,
    };
  }
  const market = {
    question: "Will ETH be above $3000?",
    oracleUrl: "https://example.com/price.json",
    jsonPath: ".price",
    target: 3000n,
    comparator: 0,
    bettingSeconds: 60n,
    resolveDelaySeconds: 30n,
  };

  async function expectRejected(fn: () => Promise<unknown>) {
    await assert.rejects(fn);
  }

  it("deploys with a valid block time", async function () {
    const { factory } = await deploy();

    assert.equal(
      await factory.read.blockTimeMs(),
      195n,
    );
  });

  it("rejects zero block time", async function () {
    const { viem } = await hre.network.getOrCreate();

    await expectRejected(async () => {
      await viem.deployContract("RitualPredict", [0n]);
    });
  });

  it("rejects an empty question", async function () {
    const { factory } = await deploy();

    await expectRejected(() =>
      factory.write.createMarket([
        {
          ...market,
          question: "",
        },
      ]),
    );
  });

  it("rejects an empty oracle URL", async function () {
    const { factory } = await deploy();

    await expectRejected(() =>
      factory.write.createMarket([
        {
          ...market,
          oracleUrl: "",
        },
      ]),
    );
  });

  it("rejects an empty JSON path", async function () {
    const { factory } = await deploy();

    await expectRejected(() =>
      factory.write.createMarket([
        {
          ...market,
          jsonPath: "",
        },
      ]),
    );
  });

  it("rejects betting duration below minimum", async function () {
    const { factory } = await deploy();

    await expectRejected(() =>
      factory.write.createMarket([
        {
          ...market,
          bettingSeconds: 29n,
        },
      ]),
    );
  });

  it("rejects resolution delay below minimum", async function () {
    const { factory } = await deploy();

    await expectRejected(() =>
      factory.write.createMarket([
        {
          ...market,
          resolveDelaySeconds: 14n,
        },
      ]),
    );
  });

  it("creates a market and records its resolution rule", async function () {
    const { factory } = await deploy();

    await factory.write.createMarket([market]);

    const created = await factory.read.getMarket([1n]);

    assert.equal(created.id, 1n);
    assert.equal(created.question, market.question);
    assert.equal(created.oracleUrl, market.oracleUrl);
    assert.equal(created.jsonPath, market.jsonPath);
    assert.equal(created.target, 3000n);
    assert.equal(created.comparator, 0);
    assert.equal(created.totalYes, 0n);
    assert.equal(created.totalNo, 0n);
    assert.equal(created.attempts, 0);
    assert.equal(created.outcome, 0);
  });

  it("accepts YES and NO bets", async function () {
    const { factory, alice, bob } = await deploy();

    await factory.write.createMarket([market]);

    await factory.write.bet(
      [1n, true],
      {
        account: alice.account,
        value: 1_000_000_000_000_000_000n,
      },
    );

    await factory.write.bet(
      [1n, false],
      {
        account: bob.account,
        value: 2_000_000_000_000_000_000n,
      },
    );

    const result = await factory.read.getMarket([1n]);

    assert.equal(result.totalYes, 1_000_000_000_000_000_000n);
    assert.equal(result.totalNo, 2_000_000_000_000_000_000n);

    const aliceStake = await factory.read.stakesOf([
      1n,
      alice.account.address,
    ]);

    assert.equal(
      aliceStake[0],
      1_000_000_000_000_000_000n,
    );
  });

  it("rejects a zero-value bet", async function () {
    const { factory } = await deploy();

    await factory.write.createMarket([market]);

    await expectRejected(() =>
      factory.write.bet([1n, true]),
    );
  });

  it("records the Scheduler parameters when creating a market", async function () {
    const { factory, viem } = await deploy();

    await factory.write.createMarket([market]);

    const scheduler = await viem.getContractAt(
      "MockScheduler",
      SCHEDULER,
    );

    const call = await scheduler.read.getCall([1n]);
    const created = await factory.read.getMarket([1n]);

    assert.equal(call[1], 2_000_000);
    assert.equal(call[3], 3);
    assert.equal(call[4], 200);
    assert.equal(call[5], 150);
    assert.equal(call[6], 1_000_000_000n);
    assert.equal(call[7], 0n);
    assert.equal(call[8], 0n);
    assert.equal(
      call[9].toLowerCase(),
      factory.address.toLowerCase(),
    );

    // Scheduler starts at the market's resolution block.
    // MockScheduler stores uint32, so compare as BigInt.
    assert.equal(
      BigInt(call[2]),
      created.resolveBlock,
    );

    // abi.encodeWithSelector(selector, uint256(0), marketId)
    // = 4-byte selector + 32-byte executionIndex + 32-byte marketId.
    assert.equal(call[0].length, 138);
  });

  it("Scheduler callback reaches the market after betting closes", async function () {
    const { factory, viem } = await deploy();

    await factory.write.createMarket([market]);

    const scheduler = await viem.getContractAt(
      "MockScheduler",
      SCHEDULER,
    );

    const before = await factory.read.getMarket([1n]);

    // Advance the simulated chain beyond closeBlock.
    const client = await viem.getPublicClient();

    await client.request({
      method: "hardhat_mine" as never,
      params: [
        `0x${(Number(before.closeBlock) - Number(await client.getBlockNumber()) + 1).toString(16)}`
      ] as never,
    });

    const executeHash = await scheduler.write.execute([1n, 0n]);

    await client.waitForTransactionReceipt({
      hash: executeHash,
    });

    const after = await factory.read.getMarket([1n]);

    // The callback was reached. Oracle resolution will fail in this local
    // mock environment because 0x0801/0x0803 are not real precompiles here,
    // but the attempt itself must be recorded.
    assert.equal(after.attempts, 1);
    assert.equal(after.state, 2); // Resolving
  });

  it("exposes the expected protocol constants", async function () {
    const { factory } = await deploy();

    assert.equal(await factory.read.MAX_ATTEMPTS(), 3);
    assert.equal(
      await factory.read.RETRY_INTERVAL_BLOCKS(),
      200,
    );
    assert.equal(
      await factory.read.RESOLVE_GAS_LIMIT(),
      2_000_000,
    );
    assert.equal(
      await factory.read.SCHEDULER_TTL_BLOCKS(),
      150,
    );
    assert.equal(
      await factory.read.HTTP_TTL_BLOCKS(),
      100n,
    );
    assert.equal(
      await factory.read.EXECUTOR_PROBES(),
      8n,
    );
  });
});
