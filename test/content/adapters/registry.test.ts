import { describe, expect, it } from "vitest";
import { adapters, anichiAdapter, selectAdapter } from "@/content/adapters";

describe("content/adapters registry", () => {
    it("registers the anichi adapter as the sole built-in", () => {
        expect(adapters).toEqual([anichiAdapter]);
    });

    it("selects the anichi adapter for anichi.to URLs", () => {
        const adapter = selectAdapter(new URL("https://anichi.to/recent"));
        expect(adapter).toBe(anichiAdapter);
    });

    it("returns null for non-anichi hosts so the script self-disables", () => {
        // The manifest still ships <all_urls>, so the script may load on
        // unrelated pages. Returning null here is what stops the adapter
        // from attaching MutationObservers and controls everywhere.
        const adapter = selectAdapter(new URL("https://example.com/anything"));
        expect(adapter).toBeNull();
    });

    it("returns null when no adapter matches", () => {
        // Pass a local list rather than mutating the exported singleton so the
        // test stays safe under Vitest's parallel runner.
        const fakeAdapter = { ...anichiAdapter, matches: () => false };
        const adapter = selectAdapter(new URL("https://example.com/anything"), [fakeAdapter]);
        expect(adapter).toBeNull();
    });
});
