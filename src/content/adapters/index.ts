import { animetsuAdapter } from "./animetsu";
import { hianimeAdapter } from "./hianime";
import type { SiteAdapter } from "./types";

// Order matters: more-specific adapters first; hianime is the catch-all fallback.
export const adapters: SiteAdapter[] = [animetsuAdapter, hianimeAdapter];

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
export { animetsuAdapter, hianimeAdapter };
