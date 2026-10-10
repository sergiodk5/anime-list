import type { AnimeMetadata } from "@/commons/models";
import type {
    AnimeMetadataRepository,
    CompletedAnimeRepository,
    EpisodeProgressRepository,
    PlanToWatchRepository,
} from "@/commons/repositories";
import { type AniListClient, type AniListMedia, AniListRateLimitError } from "@/commons/services/AniListClient";
import { AnimeMetadataService, computeNextRefresh, failureBackoff } from "@/commons/services/AnimeMetadataService";
import { beforeEach, describe, expect, it, vi } from "vitest";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.parse("2026-10-10T12:00:00Z");

function createMetadataStore(initial: AnimeMetadata[] = []) {
    const records = new Map(initial.map((entry) => [entry.animeId, { ...entry }]));
    return {
        records,
        findById: vi.fn(async (id: string) => records.get(id) ?? null),
        findAll: vi.fn(async () => [...records.values()]),
        create: vi.fn(async (entry: AnimeMetadata) => void records.set(entry.animeId, entry)),
        update: vi.fn(async (id: string, data: Partial<AnimeMetadata>) => {
            const existing = records.get(id);
            if (existing) records.set(id, { ...existing, ...data });
        }),
        replaceAll: vi.fn(async (entries: AnimeMetadata[]) => {
            records.clear();
            entries.forEach((entry) => records.set(entry.animeId, entry));
        }),
    };
}

function createListStore(ids: string[]) {
    return {
        exists: vi.fn(async (id: string) => ids.includes(id)),
        findAll: vi.fn(async () => ids.map((animeId) => ({ animeId }))),
    };
}

function media(overrides: Partial<AniListMedia> & { id: number }): AniListMedia {
    return { idMal: null, episodes: null, status: "RELEASING", nextAiringEpisode: null, ...overrides };
}

function linked(animeId: string, overrides: Partial<AnimeMetadata> = {}): AnimeMetadata {
    return { animeId, anilistId: 1, totalEpisodes: null, nextRefreshAt: 0, ...overrides };
}

describe("computeNextRefresh", () => {
    it("never refreshes finished or cancelled shows", () => {
        expect(computeNextRefresh(media({ id: 1, status: "FINISHED" }), NOW)).toBeNull();
        expect(computeNextRefresh(media({ id: 1, status: "CANCELLED" }), NOW)).toBeNull();
    });

    it("refreshes an airing show an hour after its next episode airs", () => {
        const airingAt = (NOW + 2 * DAY) / 1000;
        const next = computeNextRefresh(media({ id: 1, nextAiringEpisode: { episode: 4, airingAt } }), NOW);
        expect(next).toBe(airingAt * 1000 + HOUR);
    });

    it("waits at least an hour when the announced airing time has already passed", () => {
        const airingAt = (NOW - DAY) / 1000;
        const next = computeNextRefresh(media({ id: 1, nextAiringEpisode: { episode: 4, airingAt } }), NOW);
        expect(next).toBe(NOW + HOUR);
    });

    it("checks daily when there is no schedule", () => {
        expect(computeNextRefresh(media({ id: 1, status: "NOT_YET_RELEASED" }), NOW)).toBe(NOW + DAY);
        expect(computeNextRefresh(media({ id: 1, status: "RELEASING" }), NOW)).toBe(NOW + DAY);
    });
});

describe("failureBackoff", () => {
    it("backs off 1h, 6h, then 24h", () => {
        expect(failureBackoff(1)).toBe(HOUR);
        expect(failureBackoff(2)).toBe(6 * HOUR);
        expect(failureBackoff(3)).toBe(DAY);
        expect(failureBackoff(10)).toBe(DAY);
    });
});

describe("AnimeMetadataService", () => {
    let metadata: ReturnType<typeof createMetadataStore>;
    let fetchMedia: ReturnType<typeof vi.fn>;

    function createService(tracked: { watching?: string[]; planned?: string[]; completed?: string[] }) {
        return new AnimeMetadataService({
            metadataRepository: metadata as unknown as AnimeMetadataRepository,
            episodeProgressRepository: createListStore(tracked.watching ?? []) as unknown as EpisodeProgressRepository,
            planToWatchRepository: createListStore(tracked.planned ?? []) as unknown as PlanToWatchRepository,
            completedAnimeRepository: createListStore(tracked.completed ?? []) as unknown as CompletedAnimeRepository,
            client: { fetchMedia } as unknown as AniListClient,
        });
    }

    beforeEach(() => {
        metadata = createMetadataStore();
        fetchMedia = vi.fn().mockResolvedValue([]);
    });

    describe("linkFromPage", () => {
        const page = {
            animeId: "overgeared",
            anilistId: 212888,
            malId: 64340,
            nextEpisode: { episode: 3, airingAt: 1791729000 },
        };

        it("ignores anime that are not tracked", async () => {
            const service = createService({});

            expect(await service.linkFromPage(page, NOW)).toBe(false);
            expect(metadata.create).not.toHaveBeenCalled();
        });

        it("ignores pages without any external id", async () => {
            const service = createService({ watching: ["overgeared"] });

            expect(await service.linkFromPage({ animeId: "overgeared" }, NOW)).toBe(false);
            expect(metadata.create).not.toHaveBeenCalled();
        });

        it("stores a new link with the page schedule and asks for a fetch", async () => {
            const service = createService({ planned: ["overgeared"] });

            expect(await service.linkFromPage(page, NOW)).toBe(true);
            expect(metadata.records.get("overgeared")).toEqual({
                animeId: "overgeared",
                anilistId: 212888,
                malId: 64340,
                totalEpisodes: null,
                nextEpisode: { episode: 3, airingAt: 1791729000 },
                nextRefreshAt: 0,
            });
        });

        it("does nothing once the same link has been fetched from AniList", async () => {
            metadata = createMetadataStore([
                linked("overgeared", {
                    anilistId: 212888,
                    malId: 64340,
                    totalEpisodes: 12,
                    fetchedAt: "2026-10-09T00:00:00Z",
                    nextRefreshAt: NOW + DAY,
                }),
            ]);
            const service = createService({ watching: ["overgeared"] });

            expect(await service.linkFromPage(page, NOW)).toBe(false);
            expect(metadata.create).not.toHaveBeenCalled();
            expect(metadata.update).not.toHaveBeenCalled();
        });

        it("refreshes the page schedule while AniList has not answered yet, respecting backoff", async () => {
            metadata = createMetadataStore([
                linked("overgeared", { anilistId: 212888, malId: 64340, failureCount: 1, nextRefreshAt: NOW + HOUR }),
            ]);
            const service = createService({ watching: ["overgeared"] });

            expect(await service.linkFromPage(page, NOW)).toBe(false);
            expect(metadata.records.get("overgeared")?.nextEpisode).toEqual(page.nextEpisode);
        });

        it("relinks and resets data when the page reports different ids", async () => {
            metadata = createMetadataStore([
                linked("overgeared", { anilistId: 999, totalEpisodes: 24, fetchedAt: "2026-10-09T00:00:00Z" }),
            ]);
            const service = createService({ completed: ["overgeared"] });

            expect(await service.linkFromPage(page, NOW)).toBe(true);
            expect(metadata.records.get("overgeared")).toMatchObject({
                anilistId: 212888,
                totalEpisodes: null,
                nextRefreshAt: 0,
            });
            expect(metadata.records.get("overgeared")?.fetchedAt).toBeUndefined();
        });
    });

    describe("refreshDue", () => {
        it("fetches every due entry in one batch and stores totals and schedule", async () => {
            metadata = createMetadataStore([
                linked("a", { anilistId: 1 }),
                linked("b", { anilistId: 2, nextRefreshAt: NOW - 1 }),
                linked("c", { anilistId: 3, nextRefreshAt: NOW + HOUR }),
                linked("d", { anilistId: 4, nextRefreshAt: null }),
            ]);
            const airingAt = (NOW + 2 * DAY) / 1000;
            fetchMedia.mockResolvedValue([
                media({ id: 1, idMal: 11, episodes: 12, nextAiringEpisode: { episode: 3, airingAt } }),
                media({ id: 2, episodes: 24, status: "FINISHED" }),
            ]);
            const service = createService({ watching: ["a", "b", "c", "d"] });

            const summary = await service.refreshDue(NOW);

            expect(fetchMedia).toHaveBeenCalledTimes(1);
            expect(fetchMedia).toHaveBeenCalledWith([1, 2], "id");
            expect(summary).toEqual({ fetched: 2, failed: 0, pruned: 0, rateLimited: false });
            expect(metadata.records.get("a")).toMatchObject({
                malId: 11,
                totalEpisodes: 12,
                airingStatus: "RELEASING",
                nextEpisode: { episode: 3, airingAt },
                fetchedAt: new Date(NOW).toISOString(),
                nextRefreshAt: airingAt * 1000 + HOUR,
                failureCount: 0,
            });
            expect(metadata.records.get("b")).toMatchObject({ totalEpisodes: 24, nextRefreshAt: null });
            expect(metadata.records.get("c")?.totalEpisodes).toBeNull();
        });

        it("clears a stale next episode once AniList has no upcoming one", async () => {
            metadata = createMetadataStore([
                linked("a", { nextEpisode: { episode: 12, airingAt: 1 } }),
            ]);
            fetchMedia.mockResolvedValue([media({ id: 1, episodes: 12, status: "FINISHED" })]);

            await createService({ completed: ["a"] }).refreshDue(NOW);

            expect(metadata.records.get("a")?.nextEpisode).toBeUndefined();
        });

        it("looks up entries without an AniList id by MAL id", async () => {
            metadata = createMetadataStore([linked("a", { anilistId: undefined, malId: 64340 })]);
            fetchMedia.mockResolvedValue([media({ id: 212888, idMal: 64340, episodes: 12 })]);

            await createService({ planned: ["a"] }).refreshDue(NOW);

            expect(fetchMedia).toHaveBeenCalledWith([64340], "idMal");
            expect(metadata.records.get("a")).toMatchObject({ anilistId: 212888, totalEpisodes: 12 });
        });

        it("splits large refreshes into batches of 50", async () => {
            const entries = Array.from({ length: 51 }, (_, i) => linked(`anime-${i}`, { anilistId: i + 1 }));
            metadata = createMetadataStore(entries);

            await createService({ watching: entries.map((entry) => entry.animeId) }).refreshDue(NOW);

            expect(fetchMedia).toHaveBeenCalledTimes(2);
            expect(fetchMedia.mock.calls[0][0]).toHaveLength(50);
            expect(fetchMedia.mock.calls[1][0]).toHaveLength(1);
        });

        it("drops metadata for anime that are no longer tracked", async () => {
            metadata = createMetadataStore([
                linked("kept", { nextRefreshAt: null }),
                linked("gone", { nextRefreshAt: null }),
            ]);

            const summary = await createService({ completed: ["kept"] }).refreshDue(NOW);

            expect(summary.pruned).toBe(1);
            expect([...metadata.records.keys()]).toEqual(["kept"]);
            expect(fetchMedia).not.toHaveBeenCalled();
        });

        it("does not write when nothing is due or pruned", async () => {
            metadata = createMetadataStore([linked("a", { nextRefreshAt: NOW + HOUR })]);

            await createService({ watching: ["a"] }).refreshDue(NOW);

            expect(metadata.replaceAll).not.toHaveBeenCalled();
        });

        it("backs off entries AniList did not return", async () => {
            metadata = createMetadataStore([linked("a", { failureCount: 1 })]);

            const summary = await createService({ watching: ["a"] }).refreshDue(NOW);

            expect(summary.failed).toBe(1);
            expect(metadata.records.get("a")).toMatchObject({ failureCount: 2, nextRefreshAt: NOW + 6 * HOUR });
        });

        it("backs off the batch when the request fails", async () => {
            metadata = createMetadataStore([linked("a")]);
            fetchMedia.mockRejectedValue(new Error("network down"));

            const summary = await createService({ watching: ["a"] }).refreshDue(NOW);

            expect(summary.failed).toBe(1);
            expect(metadata.records.get("a")).toMatchObject({ failureCount: 1, nextRefreshAt: NOW + HOUR });
        });

        it("stops and reschedules the remaining batches when rate limited", async () => {
            const entries = [
                ...Array.from({ length: 50 }, (_, i) => linked(`id-${i}`, { anilistId: i + 1 })),
                linked("mal-only", { anilistId: undefined, malId: 5 }),
            ];
            metadata = createMetadataStore(entries);
            fetchMedia.mockRejectedValueOnce(new AniListRateLimitError(30));

            const summary = await createService({ watching: entries.map((entry) => entry.animeId) }).refreshDue(NOW);

            expect(summary.rateLimited).toBe(true);
            expect(fetchMedia).toHaveBeenCalledTimes(1);
            expect(metadata.records.get("id-0")?.nextRefreshAt).toBe(NOW + 30_000);
            expect(metadata.records.get("mal-only")?.nextRefreshAt).toBe(NOW + 30_000);
            expect(metadata.records.get("id-0")?.failureCount).toBeUndefined();
        });

        it("keeps a link that a page changed while the request was in flight", async () => {
            metadata = createMetadataStore([linked("a", { anilistId: 1 })]);
            fetchMedia.mockImplementation(async () => {
                metadata.records.set("a", linked("a", { anilistId: 2 }));
                return [media({ id: 1, episodes: 12 })];
            });

            await createService({ watching: ["a"] }).refreshDue(NOW);

            expect(metadata.records.get("a")).toMatchObject({ anilistId: 2, totalEpisodes: null, nextRefreshAt: 0 });
        });
    });
});
