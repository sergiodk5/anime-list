import { anikototvAdapter } from "./anikototv";
import type { SiteAdapter } from "./types";

export const adapters: SiteAdapter[] = [anikototvAdapter];

/**
 * Resolve the SiteAdapter that should drive the content script for the given
 * URL. The optional `candidates` parameter exists primarily for tests so they
 * can pass a local list rather than mutating the exported singleton.
 */
export function selectAdapter(
    url: URL = new URL(window.location.href),
    candidates: readonly SiteAdapter[] = adapters,
): SiteAdapter | null {
    return candidates.find((adapter) => adapter.matches(url)) ?? null;
}

export type { SiteAdapter, WatchPageAdapter } from "./types";
export { anikototvAdapter };
