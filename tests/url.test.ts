import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isArenaHttps, isTrustedOtaEndpoint, parseArenaUrl } from "../src/core/url.ts";

describe("parseArenaUrl", () => {
  it("accepts https://arena.ai/agent", () => {
    const r = parseArenaUrl("https://arena.ai/agent");
    assert.equal(r.ok, true);
  });
  it("rejects prefix confusion", () => {
    assert.equal(isArenaHttps("https://arena.ai.evil.com/agent"), false);
  });
  it("rejects http", () => {
    assert.equal(isArenaHttps("http://arena.ai/agent"), false);
  });
  it("rejects credentials in URL", () => {
    assert.equal(isArenaHttps("https://user:pass@arena.ai/agent"), false);
  });
  it("rejects localhost", () => {
    assert.equal(isArenaHttps("https://127.0.0.1/agent"), false);
  });
});

describe("OTA endpoints", () => {
  it("allows GitHub raw", () => {
    assert.equal(
      isTrustedOtaEndpoint(
        "https://raw.githubusercontent.com/Pr00k/Agent-Mode/arena/01a08b05-agent-mode/ota/manifest.json",
      ),
      true,
    );
  });
  it("allows local /ota/", () => {
    assert.equal(isTrustedOtaEndpoint("/ota/manifest.json"), true);
  });
  it("rejects arbitrary hosts", () => {
    assert.equal(isTrustedOtaEndpoint("https://evil.example/ota.json"), false);
  });
});
