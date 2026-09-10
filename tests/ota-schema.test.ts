import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cmpVersion, parseManifest } from "../src/core/ota-schema.ts";

describe("parseManifest", () => {
  it("accepts a minimal valid manifest", () => {
    const m = parseManifest({ contentVersion: "1.3.1", agentUrl: "https://arena.ai/agent" });
    assert.ok(m);
    assert.equal(m.contentVersion, "1.3.1");
  });
  it("rejects css injection", () => {
    assert.equal(parseManifest({ contentVersion: "1.3.1", css: "body{}" }), null);
  });
  it("rejects non-Arena agentUrl", () => {
    assert.equal(
      parseManifest({ contentVersion: "1.3.1", agentUrl: "https://evil.example/" }),
      null,
    );
  });
  it("rejects bad version", () => {
    assert.equal(parseManifest({ contentVersion: "latest" }), null);
  });
});

describe("cmpVersion", () => {
  it("orders semver", () => {
    assert.ok(cmpVersion("1.3.1", "1.3.0") > 0);
    assert.equal(cmpVersion("1.3.0", "1.3.0"), 0);
    assert.ok(cmpVersion("1.2.9", "1.3.0") < 0);
  });
});
