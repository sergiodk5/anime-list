import { ANILIST_ENDPOINT, AniListClient, AniListRateLimitError } from "@/commons/services/AniListClient";
import { describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
    return new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { "Content-Type": "application/json", ...init.headers },
    });
}

const overgeared = {
    id: 212888,
    idMal: 64340,
    episodes: 12,
    status: "RELEASING",
    nextAiringEpisode: { episode: 3, airingAt: 1791729000 },
};

describe("AniListClient", () => {
    it("requests all ids in one POST and returns the media list", async () => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ data: { Page: { media: [overgeared] } } }));
        const client = new AniListClient(fetchFn);

        const media = await client.fetchMedia([212888, 1]);

        expect(media).toEqual([overgeared]);
        expect(fetchFn).toHaveBeenCalledTimes(1);
        const [url, init] = fetchFn.mock.calls[0];
        expect(url).toBe(ANILIST_ENDPOINT);
        expect(init.method).toBe("POST");
        const body = JSON.parse(init.body);
        expect(body.variables).toEqual({ ids: [212888, 1], perPage: 2 });
        expect(body.query).toContain("id_in: $ids");
    });

    it("filters by MAL id when asked", async () => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ data: { Page: { media: [] } } }));

        await new AniListClient(fetchFn).fetchMedia([64340], "idMal");

        expect(JSON.parse(fetchFn.mock.calls[0][1].body).query).toContain("idMal_in: $ids");
    });

    it("does not call the API for an empty batch", async () => {
        const fetchFn = vi.fn();

        expect(await new AniListClient(fetchFn).fetchMedia([])).toEqual([]);
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it("rejects batches larger than one page", async () => {
        const fetchFn = vi.fn();
        const ids = Array.from({ length: 51 }, (_, i) => i + 1);

        await expect(new AniListClient(fetchFn).fetchMedia(ids)).rejects.toThrow("batch too large");
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it("reports rate limiting with the Retry-After delay", async () => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { status: 429, headers: { "Retry-After": "30" } }));

        const error = await new AniListClient(fetchFn).fetchMedia([1]).catch((e) => e);

        expect(error).toBeInstanceOf(AniListRateLimitError);
        expect(error.retryAfterSeconds).toBe(30);
    });

    it("falls back to a default delay when Retry-After is missing", async () => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { status: 429 }));

        const error = await new AniListClient(fetchFn).fetchMedia([1]).catch((e) => e);

        expect(error.retryAfterSeconds).toBe(60);
    });

    it("throws on GraphQL errors", async () => {
        const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ errors: [{ message: "Invalid query" }] }));

        await expect(new AniListClient(fetchFn).fetchMedia([1])).rejects.toThrow("Invalid query");
    });

    it("throws on non-OK responses without a JSON body", async () => {
        const fetchFn = vi.fn().mockResolvedValue(new Response("oops", { status: 500 }));

        await expect(new AniListClient(fetchFn).fetchMedia([1])).rejects.toThrow("HTTP 500");
    });
});
