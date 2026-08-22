import { describe, it } from "node:test";
import hre from "hardhat";
import assert from "node:assert/strict";

describe("Precompile mock debug", async function () {
  it("checks mocked 0x0801 and 0x0803", async function () {
    const { viem } = await hre.network.getOrCreate();
    const client = await viem.getPublicClient();

    const http = await viem.deployContract("MockHTTP");
    const jq = await viem.deployContract("MockJQ");

    const httpCode = await client.getCode({
      address: http.address,
    });

    const jqCode = await client.getCode({
      address: jq.address,
    });

    assert.ok(httpCode && httpCode !== "0x");
    assert.ok(jqCode && jqCode !== "0x");

    await client.request({
      method: "hardhat_setCode" as never,
      params: [
        "0x0000000000000000000000000000000000000801",
        httpCode,
      ] as never,
    });

    await client.request({
      method: "hardhat_setCode" as never,
      params: [
        "0x0000000000000000000000000000000000000803",
        jqCode,
      ] as never,
    });

    const httpAfter = await client.getCode({
      address: "0x0000000000000000000000000000000000000801",
    });

    const jqAfter = await client.getCode({
      address: "0x0000000000000000000000000000000000000803",
    });

    console.log("HTTP 0x0801 code:", httpAfter);
    console.log("JQ   0x0803 code:", jqAfter);

    const httpResult = await client.request({
      method: "eth_call" as never,
      params: [
        {
          to: "0x0000000000000000000000000000000000000801",
          data: "0x",
        },
        "latest",
      ] as never,
    });

    console.log("HTTP result:", httpResult);

    const jqResult = await client.request({
      method: "eth_call" as never,
      params: [
        {
          to: "0x0000000000000000000000000000000000000803",
          data: "0x",
        },
        "latest",
      ] as never,
    });

    console.log("JQ result:", jqResult);
  });
});
