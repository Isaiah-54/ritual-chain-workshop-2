import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";

const SCHEDULER =
  "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B";

describe("RitualPredict", function () {
  async function deploy() {
    const { viem } = await hre.network.getOrCreate();

    // Deploy the mock scheduler and copy its runtime bytecode
    // to Ritual's canonical Scheduler address.
    const mock = await viem.deployContract("MockScheduler");

    const client = await viem.getPublicClient();

    const code = await client.getCode({
      address: mock.address,
    });

    if (!code) {
      throw new Error("Mock Scheduler has no runtime bytecode");
    }

    await client.request({
      method: "hardhat_setCode",
      params: [SCHEDULER, code],
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
