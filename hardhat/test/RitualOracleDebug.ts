import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";

const SCHEDULER =
  "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B";
const TEE_SERVICE_REGISTRY =
  "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
const HTTP =
  "0x0000000000000000000000000000000000000801";
const JQ =
  "0x0000000000000000000000000000000000000803";

describe("Ritual oracle debug", function () {
  it("runs the complete scheduler -> TEE -> HTTP -> jq path", async function () {
    const { viem } = await hre.network.getOrCreate();
    const client = await viem.getPublicClient();

    const wallets = await viem.getWalletClients();
    assert.ok(
      wallets.length >= 3,
      "Need at least 3 Hardhat wallets",
    );

    const bettorYes = wallets[1];
    const bettorNo = wallets[2];

    // ------------------------------------------------------------
    // Install MockTEERegistry at canonical Ritual address
    // ------------------------------------------------------------
    const registry = await viem.deployContract("MockTEERegistry");
    const registryCode = await client.getCode({
      address: registry.address,
    });

    assert.ok(registryCode && registryCode !== "0x");

    await client.request({
      method: "hardhat_setCode" as never,
      params: [TEE_SERVICE_REGISTRY, registryCode] as never,
    });

    const registryAtCanonical = await viem.getContractAt(
      "MockTEERegistry",
      TEE_SERVICE_REGISTRY,
    );

    const executor = await registryAtCanonical.read.executor();
    const available = await registryAtCanonical.read.available();

    console.log("TEE executor:", executor);
    console.log("TEE available:", available);

    assert.equal(
      executor.toLowerCase(),
      "0x0000000000000000000000000000000000000001",
    );
    assert.equal(available, true);

    // ------------------------------------------------------------
    // Install MockScheduler at canonical Ritual address
    // ------------------------------------------------------------
    const schedulerImpl = await viem.deployContract("MockScheduler");
    const schedulerCode = await client.getCode({
      address: schedulerImpl.address,
    });

    assert.ok(schedulerCode && schedulerCode !== "0x");

    await client.request({
      method: "hardhat_setCode" as never,
      params: [SCHEDULER, schedulerCode] as never,
    });

    // hardhat_setCode installs runtime bytecode only.
    // MockScheduler's constructor/initializer does not run at the
    // canonical address, so initialize nextCallId storage slot 0.
    await client.request({
      method: "hardhat_setStorageAt" as never,
      params: [
        SCHEDULER,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ] as never,
    });
    // The scheduler must be accessed at the canonical Ritual address.
    const scheduler = await viem.getContractAt(
      "MockScheduler",
      SCHEDULER,
    );

    console.log(
      "Scheduler nextCallId after storage initialization:",
      await scheduler.read.nextCallId(),
    );

    assert.equal(
      await scheduler.read.nextCallId(),
      1n,
    );

    console.log(
      "Scheduler code installed:",
      (await client.getCode({ address: SCHEDULER })) !== "0x",
    );

    assert.notEqual(
      await client.getCode({ address: SCHEDULER }),
      "0x",
    );

    // ------------------------------------------------------------
    // Install MockHTTP and MockJQ
    // ------------------------------------------------------------
    const http = await viem.deployContract("MockHTTP");
    const httpCode = await client.getCode({
      address: http.address,
    });

    const jq = await viem.deployContract("MockJQ");
    const jqCode = await client.getCode({
      address: jq.address,
    });

    assert.ok(httpCode && httpCode !== "0x");
    assert.ok(jqCode && jqCode !== "0x");

    await client.request({
      method: "hardhat_setCode" as never,
      params: [HTTP, httpCode] as never,
    });

    await client.request({
      method: "hardhat_setCode" as never,
      params: [JQ, jqCode] as never,
    });

    console.log(
      "HTTP code installed:",
      (await client.getCode({ address: HTTP })) !== "0x",
    );

    console.log(
      "JQ code installed:",
      (await client.getCode({ address: JQ })) !== "0x",
    );

    // ------------------------------------------------------------
    // Deploy RitualPredict
    // ------------------------------------------------------------
    const factory =
      await viem.deployContract("RitualPredict", [195n]);

    console.log(
      "RitualPredict:",
      factory.address,
    );

    // ------------------------------------------------------------
    // Verify HTTP decoder independently
    // ------------------------------------------------------------
    const rawHttp = await client.request({
      method: "eth_call" as never,
      params: [
        {
          to: HTTP,
          data: "0x",
        },
        "latest",
      ] as never,
    });

    console.log("Raw HTTP bytes:", rawHttp);

    const decoded =
      await factory.read.decodeHttpResponse([
        rawHttp as `0x${string}`,
      ]);

    console.log("Decoded HTTP:", decoded);

    assert.equal(decoded[0], 200);
    const decodedBody = Buffer.from(
      decoded[1].slice(2),
      "hex",
    ).toString("utf8");

    console.log("Decoded HTTP body:", decodedBody);

    assert.equal(
      decodedBody,
      '{"price":3500}',
    );

    // ------------------------------------------------------------
    // Verify jq independently
    // ------------------------------------------------------------
    const rawJq = await client.request({
      method: "eth_call" as never,
      params: [
        {
          to: JQ,
          data: "0x",
        },
        "latest",
      ] as never,
    });

    console.log("Raw JQ bytes:", rawJq);

    assert.equal(
      BigInt(rawJq as string),
      3500n,
    );

    // ------------------------------------------------------------
    // Create a market
    // ------------------------------------------------------------
    //
    // We deliberately use very small durations because the mock
    // scheduler executes manually below.
    //
    const question = "Will the oracle price be above 3000?";
    const oracleUrl = "https://example.com/price";
    const jsonPath = ".price";

    const createHash = await factory.write.createMarket([
      {
        question,
        oracleUrl,
        jsonPath,
        target: 3000n,
        comparator: 1, // GTE
        bettingSeconds: 60n,
        resolveDelaySeconds: 60n,
      },
    ]);

    await client.waitForTransactionReceipt({
      hash: createHash,
    });

    console.log("Market created");

    // ------------------------------------------------------------
    // Read market #1
    // ------------------------------------------------------------
    const market = await factory.read.getMarket([1n]);

    console.log("Market:", market);

    // ------------------------------------------------------------
    // Place opposite bets before the market closes
    // ------------------------------------------------------------
    const betAmount = 1n * 10n ** 18n;

    console.log(
      "YES bettor:",
      bettorYes.account.address,
    );
    console.log(
      "NO bettor:",
      bettorNo.account.address,
    );

    const yesBetHash = await bettorYes.writeContract({
      address: factory.address,
      abi: factory.abi,
      functionName: "bet",
      args: [1n, true],
      value: betAmount,
    });

    await client.waitForTransactionReceipt({
      hash: yesBetHash,
    });

    const noBetHash = await bettorNo.writeContract({
      address: factory.address,
      abi: factory.abi,
      functionName: "bet",
      args: [1n, false],
      value: betAmount,
    });

    await client.waitForTransactionReceipt({
      hash: noBetHash,
    });

    const marketAfterBets =
      await factory.read.getMarket([1n]);

    console.log(
      "Market after bets:",
      marketAfterBets,
    );

    assert.equal(
      marketAfterBets.totalYes,
      betAmount,
      "YES pool should contain 1 ETH",
    );

    assert.equal(
      marketAfterBets.totalNo,
      betAmount,
      "NO pool should contain 1 ETH",
    );

    const yesStakeBefore =
      await factory.read.stakesOf([
        1n,
        bettorYes.account.address,
      ]);

    const noStakeBefore =
      await factory.read.stakesOf([
        1n,
        bettorNo.account.address,
      ]);

    console.log(
      "YES stake before resolution:",
      yesStakeBefore,
    );

    console.log(
      "NO stake before resolution:",
      noStakeBefore,
    );

    assert.equal(
      yesStakeBefore[0],
      betAmount,
      "YES bettor stake incorrect",
    );

    assert.equal(
      noStakeBefore[1],
      betAmount,
      "NO bettor stake incorrect",
    );


    // ------------------------------------------------------------
    // Inspect scheduler state and the actual scheduled call
    // ------------------------------------------------------------
    console.log(
      "Scheduler nextCallId:",
      await scheduler.read.nextCallId(),
    );

    const scheduledCallId = market.scheduleId;

    console.log(
      "Market scheduleId:",
      scheduledCallId,
    );

    const scheduled =
      await scheduler.read.getCall([scheduledCallId]);

    console.log(
      "Scheduled call:",
      scheduled,
    );

    assert.equal(
      scheduled[9].toLowerCase(),
      factory.address.toLowerCase(),
    );

    // ------------------------------------------------------------
    // Advance enough blocks to close the market
    // ------------------------------------------------------------
    // Advance the chain past the market's actual resolveBlock.
    const currentBlock = await client.getBlockNumber();
    const resolveBlock = market.resolveBlock;

    assert.ok(
      resolveBlock > currentBlock,
      `resolveBlock ${resolveBlock} must be ahead of current block ${currentBlock}`,
    );

    const blocksToMine = resolveBlock - currentBlock + 1n;

    console.log(
      "Current block:",
      currentBlock,
      "Resolve block:",
      resolveBlock,
      "Mining:",
      blocksToMine,
      "blocks",
    );

    await client.request({
      method: "hardhat_mine" as never,
      params: [
        `0x${blocksToMine.toString(16)}`,
      ] as never,
    });

    const blockAfterMining = await client.getBlockNumber();

    console.log(
      "Block after mining:",
      blockAfterMining,
    );

    assert.ok(
      blockAfterMining >= resolveBlock,
      `chain did not reach resolveBlock: ${blockAfterMining} < ${resolveBlock}`,
    );

    // ------------------------------------------------------------
    // Execute scheduler callback
    // ------------------------------------------------------------
    const executeHash = await scheduler.write.execute([
      1n,
      0n,
    ]);

    await client.waitForTransactionReceipt({
      hash: executeHash,
    });

    console.log("Scheduler execution completed");

    // ------------------------------------------------------------
    // Verify final market state
    // ------------------------------------------------------------
    const finalMarket = await factory.read.getMarket([1n]);

    console.log("Final market:", finalMarket);

    // The mock HTTP returns 3500 and target is 3000 with GTE.
    // Therefore YES should win.
    //
    // We don't hard-code the enum position here; inspect the
    // returned market and print it first.
    console.log(
      "Observed oracle value:",
      finalMarket.observedValue,
    );

    assert.equal(
      finalMarket.observedValue,
      3500n,
    );

    // Outcome enum:
    // 0 = Unresolved
    // 1 = Yes
    // 2 = No
    // 3 = Invalid
    assert.equal(
      finalMarket.outcome,
      1,
      "YES should win when oracle value 3500 >= target 3000",
    );

    // ------------------------------------------------------------
    // Verify payout calculation
    // ------------------------------------------------------------
    const yesClaimable = await factory.read.stakesOf([
      1n,
      bettorYes.account.address,
    ]);

    const noClaimable = await factory.read.stakesOf([
      1n,
      bettorNo.account.address,
    ]);

    console.log(
      "YES claimable:",
      yesClaimable,
    );

    console.log(
      "NO claimable:",
      noClaimable,
    );

    // YES owns the winning side.
    // 1 ETH YES + 1 ETH NO = 2 ETH total pool.
    assert.equal(
      yesClaimable[3],
      betAmount * 2n,
      "YES bettor should be able to claim the full 2 ETH pool",
    );

    assert.equal(
      noClaimable[3],
      0n,
      "NO bettor must have zero claimable payout",
    );

    // ------------------------------------------------------------
    // YES bettor claims the 2 ETH payout
    // ------------------------------------------------------------
    const claimHash = await bettorYes.writeContract({
      address: factory.address,
      abi: factory.abi,
      functionName: "claimWinnings",
      args: [1n],
    });

    await client.waitForTransactionReceipt({
      hash: claimHash,
    });

    const yesStakeAfter = await factory.read.stakesOf([
      1n,
      bettorYes.account.address,
    ]);

    console.log(
      "YES stake after claim:",
      yesStakeAfter,
    );

    assert.equal(
      yesStakeAfter[2],
      true,
      "YES bettor should be marked settled",
    );

    assert.equal(
      yesStakeAfter[3],
      0n,
      "YES bettor should have nothing left to claim",
    );

    // ------------------------------------------------------------
    // NO bettor cannot claim anything
    // ------------------------------------------------------------
    const noStakeAfter = await factory.read.stakesOf([
      1n,
      bettorNo.account.address,
    ]);

    assert.equal(
      noStakeAfter[2],
      false,
      "NO bettor should remain unsettled",
    );

    assert.equal(
      noStakeAfter[3],
      0n,
      "NO bettor must have zero claimable payout",
    );

    console.log(
      "FULL MARKET + PAYOUT PASS",
    );
  });
});
