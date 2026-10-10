import type { AnimeMetadata, PageAnimeMetadata } from "@/commons/models";
import {
    AnimeMetadataRepository,
    CompletedAnimeRepository,
    EpisodeProgressRepository,
    PlanToWatchRepository,
} from "@/commons/repositories";
import {
    ANILIST_MAX_PER_PAGE,
    AniListClient,
    type AniListIdField,
    type AniListMedia,
    AniListRateLimitError,
} from "./AniListClient";

export const METADATA_REFRESH_MESSAGE = "ANIME_METADATA_REFRESH";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const FAILURE_BACKOFF_MS = [HOUR_MS, 6 * HOUR_MS, DAY_MS];

interface PendingUpdate {
    linkKey: string;
    value: AnimeMetadata;
}

export interface RefreshSummary {
    fetched: number;
    failed: number;
    pruned: number;
    rateLimited: boolean;
}

/**
 * When to ask AniList again: never for finished shows, right after the next
 * episode airs for airing shows, daily otherwise. Never sooner than an hour.
 */
export function computeNextRefresh(media: AniListMedia, now: number): number | null {
    if (media.status === "FINISHED" || media.status === "CANCELLED") {
        return null;
    }
    if (media.status === "RELEASING" && media.nextAiringEpisode) {
        return Math.max(media.nextAiringEpisode.airingAt * 1000 + HOUR_MS, now + HOUR_MS);
    }
    return now + DAY_MS;
}

export function failureBackoff(failureCount: number): number {
    return FAILURE_BACKOFF_MS[Math.min(failureCount, FAILURE_BACKOFF_MS.length) - 1] ?? HOUR_MS;
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function linkKey(entry: AnimeMetadata): string {
    return `${entry.anilistId ?? ""}:${entry.malId ?? ""}`;
}

function isDue(entry: AnimeMetadata, now: number): boolean {
    return entry.nextRefreshAt !== null && entry.nextRefreshAt <= now && Boolean(entry.anilistId || entry.malId);
}

/**
 * Links tracked anime to AniList and keeps their episode totals and airing
 * schedule fresh
 */
export class AnimeMetadataService {
    private readonly metadataRepository: AnimeMetadataRepository;
    private readonly episodeProgressRepository: EpisodeProgressRepository;
    private readonly planToWatchRepository: PlanToWatchRepository;
    private readonly completedAnimeRepository: CompletedAnimeRepository;
    private readonly client: AniListClient;

    constructor(deps?: {
        metadataRepository?: AnimeMetadataRepository;
        episodeProgressRepository?: EpisodeProgressRepository;
        planToWatchRepository?: PlanToWatchRepository;
        completedAnimeRepository?: CompletedAnimeRepository;
        client?: AniListClient;
    }) {
        this.metadataRepository = deps?.metadataRepository ?? new AnimeMetadataRepository();
        this.episodeProgressRepository = deps?.episodeProgressRepository ?? new EpisodeProgressRepository();
        this.planToWatchRepository = deps?.planToWatchRepository ?? new PlanToWatchRepository();
        this.completedAnimeRepository = deps?.completedAnimeRepository ?? new CompletedAnimeRepository();
        this.client = deps?.client ?? new AniListClient();
    }

    /**
     * Store the AniList/MAL ids found on a page for a tracked anime.
     * Returns true when the entry needs fetching now.
     */
    async linkFromPage(page: PageAnimeMetadata, now: number = Date.now()): Promise<boolean> {
        if (!page.anilistId && !page.malId) return false;
        if (!(await this.isTracked(page.animeId))) return false;

        const existing = await this.metadataRepository.findById(page.animeId);
        const sameIds = existing && existing.anilistId === page.anilistId && existing.malId === page.malId;

        if (sameIds) {
            if (existing.fetchedAt) return false;
            if (page.nextEpisode) {
                await this.metadataRepository.update(page.animeId, { nextEpisode: page.nextEpisode });
            }
            return isDue(existing, now);
        }

        await this.metadataRepository.create({
            animeId: page.animeId,
            anilistId: page.anilistId,
            malId: page.malId,
            totalEpisodes: null,
            nextEpisode: page.nextEpisode,
            nextRefreshAt: 0,
        });
        return true;
    }

    /**
     * Fetch every due entry from AniList in batches and drop metadata for
     * anime that are no longer tracked
     */
    async refreshDue(now: number = Date.now()): Promise<RefreshSummary> {
        const summary: RefreshSummary = { fetched: 0, failed: 0, pruned: 0, rateLimited: false };
        const tracked = await this.trackedIds();
        const all = await this.metadataRepository.findAll();
        const kept = all.filter((entry) => tracked.has(entry.animeId));
        summary.pruned = all.length - kept.length;

        const due = kept.filter((entry) => isDue(entry, now));
        const batches: Array<{ field: AniListIdField; entries: AnimeMetadata[] }> = [
            ...chunk(
                due.filter((entry) => entry.anilistId),
                ANILIST_MAX_PER_PAGE,
            ).map((entries) => ({ field: "id" as const, entries })),
            ...chunk(
                due.filter((entry) => !entry.anilistId),
                ANILIST_MAX_PER_PAGE,
            ).map((entries) => ({ field: "idMal" as const, entries })),
        ];

        const updates = new Map<string, PendingUpdate>();
        const stage = (entry: AnimeMetadata, value: AnimeMetadata) =>
            updates.set(entry.animeId, { linkKey: linkKey(entry), value });
        for (const [index, batch] of batches.entries()) {
            try {
                const media = await this.client.fetchMedia(
                    batch.entries.map((entry) => (batch.field === "id" ? entry.anilistId! : entry.malId!)),
                    batch.field,
                );
                const byId = new Map(media.map((m) => [batch.field === "id" ? m.id : m.idMal, m]));
                for (const entry of batch.entries) {
                    const match = byId.get(batch.field === "id" ? entry.anilistId! : entry.malId!);
                    if (match) {
                        stage(entry, this.applyMedia(entry, match, now));
                        summary.fetched++;
                    } else {
                        stage(entry, this.applyFailure(entry, now));
                        summary.failed++;
                    }
                }
            } catch (error) {
                if (error instanceof AniListRateLimitError) {
                    summary.rateLimited = true;
                    const retryAt = now + error.retryAfterSeconds * 1000;
                    batches
                        .slice(index)
                        .forEach((pending) =>
                            pending.entries.forEach((entry) => stage(entry, { ...entry, nextRefreshAt: retryAt })),
                        );
                    break;
                }
                console.error("[AnimeMetadata] AniList fetch failed:", error);
                batch.entries.forEach((entry) => {
                    stage(entry, this.applyFailure(entry, now));
                    summary.failed++;
                });
            }
        }

        if (updates.size > 0 || summary.pruned > 0) {
            await this.writeMerged(tracked, updates);
        }
        return summary;
    }

    private applyMedia(entry: AnimeMetadata, media: AniListMedia, now: number): AnimeMetadata {
        return {
            ...entry,
            anilistId: media.id,
            malId: media.idMal ?? entry.malId,
            totalEpisodes: media.episodes,
            airingStatus: media.status ?? undefined,
            nextEpisode: media.nextAiringEpisode ?? undefined,
            fetchedAt: new Date(now).toISOString(),
            nextRefreshAt: computeNextRefresh(media, now),
            failureCount: 0,
        };
    }

    private applyFailure(entry: AnimeMetadata, now: number): AnimeMetadata {
        const failureCount = (entry.failureCount ?? 0) + 1;
        return { ...entry, failureCount, nextRefreshAt: now + failureBackoff(failureCount) };
    }

    /**
     * Re-read before writing so a link stored by a page while we were
     * fetching is not overwritten
     */
    private async writeMerged(tracked: Set<string>, updates: Map<string, PendingUpdate>): Promise<void> {
        const latest = await this.metadataRepository.findAll();
        const merged = latest
            .filter((entry) => tracked.has(entry.animeId))
            .map((entry) => {
                const update = updates.get(entry.animeId);
                return update && update.linkKey === linkKey(entry) ? update.value : entry;
            });
        await this.metadataRepository.replaceAll(merged);
    }

    private async isTracked(animeId: string): Promise<boolean> {
        const [watching, planned, completed] = await Promise.all([
            this.episodeProgressRepository.exists(animeId),
            this.planToWatchRepository.exists(animeId),
            this.completedAnimeRepository.exists(animeId),
        ]);
        return watching || planned || completed;
    }

    private async trackedIds(): Promise<Set<string>> {
        const [watching, planned, completed] = await Promise.all([
            this.episodeProgressRepository.findAll(),
            this.planToWatchRepository.findAll(),
            this.completedAnimeRepository.findAll(),
        ]);
        return new Set([...watching, ...planned, ...completed].map((item) => item.animeId));
    }
}
