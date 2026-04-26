import { animetsuAdapter } from "./animetsu";
import { hianimeAdapter } from "./hianime";
import type { SiteAdapter } from "./types";

// Order matters: more-specific adapters first; hianime is the catch-all fallback.
export const adapters: SiteAdapter[] = [animetsuAdapter, hianimeAdapter];

export function selectAdapter(url: URL = new URL(window.location.href)): SiteAdapter | null {
    return adapters.find((adapter) => adapter.matches(url)) ?? null;
}

export type { SiteAdapter, WatchPageAdapter } from "./types";
export { animetsuAdapter, hianimeAdapter };
