import type { AnimeMetadata, AnimeStatus } from "@/commons/models";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAnimeStatus = vi.fn();

vi.mock("@/commons/services", () => ({
    AnimeService: class {
        getAnimeStatus = getAnimeStatus;
    },
}));

const {
    addControlsToItem,
    createCombinedWatchingControls,
    createEpisodeInfo,
    createNextEpisodeLine,
    getSinglePageStatusText,
    showSinglePageModal,
    closeSinglePageModal,
} = await import("@/content/index");

const NOW = Date.parse("2026-10-10T12:00:00Z");
const airingIn = (ms: number) => (NOW + ms) / 1000;
const HOUR = 60 * 60 * 1000;

const animeData = { animeId: "overgeared-rah7b", animeTitle: "Overgeared", animeSlug: "overgeared-rah7b" };

function metadata(overrides: Partial<AnimeMetadata> = {}): AnimeMetadata {
    return {
        animeId: "overgeared-rah7b",
        anilistId: 212888,
        totalEpisodes: 12,
        nextEpisode: { episode: 3, airingAt: airingIn(26 * HOUR) },
        nextRefreshAt: null,
        ...overrides,
    };
}

function status(overrides: Partial<AnimeStatus> = {}): AnimeStatus {
    return { isTracked: false, isPlanned: false, isHidden: false, isCompleted: false, ...overrides };
}

describe("createNextEpisodeLine", () => {
    it("shows the next episode and time left", () => {
        expect(createNextEpisodeLine(metadata(), NOW)?.textContent).toBe("Next: Ep 3 · in 1d 2h");
    });

    it("returns null when no upcoming episode is known", () => {
        expect(createNextEpisodeLine(metadata({ nextEpisode: undefined }), NOW)).toBeNull();
        expect(createNextEpisodeLine(undefined, NOW)).toBeNull();
    });
});

describe("createEpisodeInfo", () => {
    it("shows the total and the next episode", () => {
        const info = createEpisodeInfo(metadata(), NOW)!;

        expect(info.querySelector('[data-testid="anime-episode-info-total"]')?.textContent).toBe("12 eps");
        expect(info.querySelector('[data-testid="anime-next-episode"]')?.textContent).toBe("Next: Ep 3 · in 1d 2h");
    });

    it("leaves out an unknown total", () => {
        const info = createEpisodeInfo(metadata({ totalEpisodes: null }), NOW)!;

        expect(info.querySelector('[data-testid="anime-episode-info-total"]')).toBeNull();
        expect(info.querySelector('[data-testid="anime-next-episode"]')).not.toBeNull();
    });

    it("returns null when nothing is known", () => {
        expect(createEpisodeInfo(metadata({ totalEpisodes: null, nextEpisode: undefined }), NOW)).toBeNull();
        expect(createEpisodeInfo(undefined, NOW)).toBeNull();
    });
});

describe("createCombinedWatchingControls", () => {
    it("shows the total next to the episode and the next episode line", () => {
        const controls = createCombinedWatchingControls(animeData, 2, metadata(), 12);

        expect(controls.querySelector('[data-testid="anime-episode-total"]')?.textContent).toBe("/ 12");
        expect(controls.querySelector('[data-testid="anime-next-episode"]')).not.toBeNull();
    });

    it("shows neither when nothing is known", () => {
        const controls = createCombinedWatchingControls(animeData, 2);

        expect(controls.querySelector('[data-testid="anime-episode-total"]')).toBeNull();
        expect(controls.querySelector('[data-testid="anime-next-episode"]')).toBeNull();
    });
});

describe("tiles", () => {
    function buildTile(): HTMLElement {
        document.body.innerHTML = `
            <div class="item">
                <div class="ani poster"><a href="https://anichi.to/anime/overgeared-rah7b"><img alt="Overgeared"></a></div>
                <div class="info"><a class="name d-title" href="https://anichi.to/anime/overgeared-rah7b">Overgeared</a></div>
            </div>`;
        return document.querySelector(".item") as HTMLElement;
    }

    beforeEach(() => {
        getAnimeStatus.mockReset();
    });

    it("adds episode info to planned tiles", async () => {
        getAnimeStatus.mockResolvedValue(status({ isPlanned: true, metadata: metadata() }));
        const tile = buildTile();

        await addControlsToItem(tile);

        expect(tile.querySelector('[data-testid="anime-episode-info"]')).not.toBeNull();
    });

    it("prefers the AniList total over the stored progress total on watching tiles", async () => {
        getAnimeStatus.mockResolvedValue(
            status({
                isTracked: true,
                metadata: metadata({ totalEpisodes: 24 }),
                progress: {
                    ...animeData,
                    currentEpisode: 2,
                    episodeId: "overgeared-rah7b-episode-2",
                    lastWatched: "2026-10-09T00:00:00Z",
                    totalEpisodes: 12,
                },
            }),
        );
        const tile = buildTile();

        await addControlsToItem(tile);

        expect(tile.querySelector('[data-testid="anime-episode-total"]')?.textContent).toBe("/ 24");
    });
});

describe("single page modal", () => {
    it("states the AniList total in the watching status text", () => {
        const text = getSinglePageStatusText(
            status({
                isTracked: true,
                metadata: metadata(),
                progress: {
                    ...animeData,
                    currentEpisode: 2,
                    episodeId: "overgeared-rah7b-episode-2",
                    lastWatched: "2026-10-09T00:00:00Z",
                },
            }),
        );

        expect(text).toBe("Currently watching - Episode 2 of 12");
    });

    it("shows the next episode line", () => {
        showSinglePageModal(animeData, status({ isPlanned: true, metadata: metadata() }));

        expect(document.querySelector('[data-testid="anime-next-episode"]')).not.toBeNull();
        closeSinglePageModal();
    });
});
