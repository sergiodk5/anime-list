import { AnimeMetadataService, METADATA_REFRESH_MESSAGE } from "@/commons/services/AnimeMetadataService";
import type { SiteAdapter } from "./adapters";

let metadataService: AnimeMetadataService | null = null;

function getMetadataService(): AnimeMetadataService {
    metadataService ??= new AnimeMetadataService();
    return metadataService;
}

export function resetMetadataService(): void {
    metadataService = null;
}

function requestRefresh(animeId: string): void {
    try {
        const pending = chrome.runtime?.sendMessage?.({ type: METADATA_REFRESH_MESSAGE, animeId });
        if (pending && typeof pending.catch === "function") {
            pending.catch(() => {});
        }
    } catch {
        // The background worker may be unavailable; the periodic refresh will pick it up.
    }
}

/**
 * Link the anime shown on the current page to AniList when it is tracked
 */
export async function linkCurrentPageMetadata(adapter: SiteAdapter | null): Promise<void> {
    const page = adapter?.watchPage?.extractMetadata?.();
    if (!page) return;

    try {
        if (await getMetadataService().linkFromPage(page)) {
            requestRefresh(page.animeId);
        }
    } catch (error) {
        console.error("[AnimeMetadata] Failed to link page metadata:", error);
    }
}
