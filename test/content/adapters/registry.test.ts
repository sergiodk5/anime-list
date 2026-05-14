import { describe, expect, it } from "vitest";
import { adapters, anikototvAdapter, selectAdapter } from "@/content/adapters";

describe("content/adapters registry", () => {
    it("registers the anikototv adapter as the sole built-in", () => {
        expect(adapters).toEqual([anikototvAdapter]);
    });

    it("selects the anikototv adapter for anikototv.to URLs", () => {
        const adapter = selectAdapter(new URL("https://anikototv.to/recent"));
        expect(adapter).toBe(anikototvAdapter);
    });

    it("selects the anikototv adapter for any URL because it is the catch-all", () => {
        const adapter = selectAdapter(new URL("https://example.com/anything"));
        expect(adapter).toBe(anikototvAdapter);
    });

    it("returns null when no adapter matches", () => {
        // Pass a local list rather than mutating the exported singleton so the
        // test stays safe under Vitest's parallel runner.
        const fakeAdapter = { ...anikototvAdapter, matches: () => false };
        const adapter = selectAdapter(new URL("https://example.com/anything"), [fakeAdapter]);
        expect(adapter).toBeNull();
    });
});
