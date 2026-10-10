import { beforeEach, describe, expect, it, vi } from "vitest";

const linkFromPage = vi.fn();

vi.mock("@/commons/services/AnimeMetadataService", () => ({
    METADATA_REFRESH_MESSAGE: "ANIME_METADATA_REFRESH",
    AnimeMetadataService: class {
        linkFromPage = linkFromPage;
    },
}));

import type { SiteAdapter } from "@/content/adapters";
import { linkCurrentPageMetadata, resetMetadataService } from "@/content/metadataLink";

const page = { animeId: "overgeared", anilistId: 212888 };

function adapterWith(extractMetadata: () => unknown): SiteAdapter {
    return { watchPage: { matches: () => true, extractAnime: () => null, extractMetadata } } as unknown as SiteAdapter;
}

describe("linkCurrentPageMetadata", () => {
    beforeEach(() => {
        resetMetadataService();
        (chrome.runtime as any).sendMessage = vi.fn().mockResolvedValue(undefined);
    });

    it("asks the background worker to fetch when a new link is stored", async () => {
        linkFromPage.mockResolvedValue(true);

        await linkCurrentPageMetadata(adapterWith(() => page));

        expect(linkFromPage).toHaveBeenCalledWith(page);
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: "ANIME_METADATA_REFRESH",
            animeId: "overgeared",
        });
    });

    it("does not message the background worker when nothing changed", async () => {
        linkFromPage.mockResolvedValue(false);

        await linkCurrentPageMetadata(adapterWith(() => page));

        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it("does nothing on pages without anime metadata", async () => {
        await linkCurrentPageMetadata(adapterWith(() => null));
        await linkCurrentPageMetadata(null);

        expect(linkFromPage).not.toHaveBeenCalled();
    });

    it("swallows a missing background receiver", async () => {
        linkFromPage.mockResolvedValue(true);
        (chrome.runtime as any).sendMessage = vi.fn().mockRejectedValue(new Error("Receiving end does not exist"));

        await expect(linkCurrentPageMetadata(adapterWith(() => page))).resolves.toBeUndefined();
    });
});
