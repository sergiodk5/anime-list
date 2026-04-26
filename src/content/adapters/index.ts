import { hianimeAdapter } from "./hianime";
import type { SiteAdapter } from "./types";

export const adapters: SiteAdapter[] = [hianimeAdapter];

export function selectAdapter(url: URL = new URL(window.location.href)): SiteAdapter | null {
    return adapters.find((adapter) => adapter.matches(url)) ?? null;
}

export type { SiteAdapter, WatchPageAdapter } from "./types";
export { hianimeAdapter };
