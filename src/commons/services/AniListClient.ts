import type { AiringStatus, NextEpisode } from "@/commons/models";

export const ANILIST_ENDPOINT = "https://graphql.anilist.co";
export const ANILIST_MAX_PER_PAGE = 50;

export type AniListIdField = "id" | "idMal";

export interface AniListMedia {
    id: number;
    idMal: number | null;
    episodes: number | null;
    status: AiringStatus | null;
    nextAiringEpisode: NextEpisode | null;
}

export class AniListRateLimitError extends Error {
    constructor(readonly retryAfterSeconds: number) {
        super(`AniList rate limit reached, retry after ${retryAfterSeconds}s`);
        this.name = "AniListRateLimitError";
    }
}

type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

const DEFAULT_RETRY_AFTER_SECONDS = 60;

function buildQuery(field: AniListIdField): string {
    const filter = field === "id" ? "id_in" : "idMal_in";
    return `query ($ids: [Int], $perPage: Int) {
    Page(perPage: $perPage) {
        media(${filter}: $ids, type: ANIME) {
            id
            idMal
            episodes
            status
            nextAiringEpisode { episode airingAt }
        }
    }
}`;
}

/**
 * Minimal AniList GraphQL client for episode totals and airing schedules
 */
export class AniListClient {
    private readonly fetchFn: FetchFn;

    constructor(fetchFn?: FetchFn) {
        this.fetchFn = fetchFn ?? ((input, init) => fetch(input, init));
    }

    /**
     * Fetch media for up to ANILIST_MAX_PER_PAGE ids in a single request
     */
    async fetchMedia(ids: number[], field: AniListIdField = "id"): Promise<AniListMedia[]> {
        if (ids.length === 0) return [];
        if (ids.length > ANILIST_MAX_PER_PAGE) {
            throw new Error(`AniList batch too large: ${ids.length} > ${ANILIST_MAX_PER_PAGE}`);
        }

        const response = await this.fetchFn(ANILIST_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ query: buildQuery(field), variables: { ids, perPage: ids.length } }),
        });

        if (response.status === 429) {
            const retryAfter = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
            throw new AniListRateLimitError(Number.isFinite(retryAfter) ? retryAfter : DEFAULT_RETRY_AFTER_SECONDS);
        }

        const body = await response.json().catch(() => null);
        if (!response.ok || !body || body.errors) {
            const detail = body?.errors?.[0]?.message ?? `HTTP ${response.status}`;
            throw new Error(`AniList request failed: ${detail}`);
        }

        return (body.data?.Page?.media ?? []) as AniListMedia[];
    }
}
