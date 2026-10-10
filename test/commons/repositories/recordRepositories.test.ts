import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import type { AnimeMetadata, CompletedAnime } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { AnimeMetadataRepository } from "@/commons/repositories/AnimeMetadataRepository";
import { CompletedAnimeRepository } from "@/commons/repositories/CompletedAnimeRepository";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
}));

const storage = vi.mocked(StorageAdapter);

type RecordItem = { animeId: string; animeTitle?: string; totalEpisodes?: number | null };

interface RecordRepository<T extends RecordItem> {
    create(item: T): Promise<void>;
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    update(id: string, data: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    clear(): Promise<void>;
    count(): Promise<number>;
}

const completed = (animeId: string): CompletedAnime => ({
    animeId,
    animeTitle: `Title ${animeId}`,
    animeSlug: animeId,
    completedAt: "2026-10-10T00:00:00.000Z",
});

const metadata = (animeId: string): AnimeMetadata => ({
    animeId,
    anilistId: 1,
    totalEpisodes: 12,
    nextRefreshAt: null,
});

describe.each([
    {
        name: "CompletedAnimeRepository",
        key: StorageKeys.COMPLETED_ANIME,
        create: () => new CompletedAnimeRepository() as RecordRepository<RecordItem>,
        item: completed as (id: string) => RecordItem,
        change: { animeTitle: "Renamed" } as Partial<RecordItem>,
    },
    {
        name: "AnimeMetadataRepository",
        key: StorageKeys.ANIME_METADATA,
        create: () => new AnimeMetadataRepository() as RecordRepository<RecordItem>,
        item: metadata as (id: string) => RecordItem,
        change: { totalEpisodes: 24 } as Partial<RecordItem>,
    },
])("$name", ({ key, create, item, change }) => {
    let repository: RecordRepository<RecordItem>;

    beforeEach(() => {
        repository = create();
        storage.set.mockResolvedValue(undefined);
        storage.remove.mockResolvedValue(undefined);
    });

    it("upserts records keyed by anime id", async () => {
        storage.get.mockResolvedValue({ a: item("a") });

        await repository.create(item("b"));

        expect(storage.set).toHaveBeenCalledWith(key, { a: item("a"), b: item("b") });
    });

    it("starts from an empty record when storage is empty", async () => {
        storage.get.mockResolvedValue(null);

        await repository.create(item("a"));

        expect(storage.set).toHaveBeenCalledWith(key, { a: item("a") });
        expect(await repository.findAll()).toEqual([]);
        expect(await repository.count()).toBe(0);
    });

    it("finds, lists, counts and checks records", async () => {
        storage.get.mockResolvedValue({ a: item("a"), b: item("b") });

        expect(await repository.findById("a")).toEqual(item("a"));
        expect(await repository.findById("missing")).toBeNull();
        expect(await repository.findAll()).toEqual([item("a"), item("b")]);
        expect(await repository.count()).toBe(2);
        expect(await repository.exists("b")).toBe(true);
        expect(await repository.exists("missing")).toBe(false);
    });

    it("merges updates into an existing record only", async () => {
        storage.get.mockResolvedValue({ a: item("a") });

        await repository.update("a", change);
        await repository.update("missing", change);

        expect(storage.set).toHaveBeenCalledTimes(1);
        expect(storage.set).toHaveBeenCalledWith(key, { a: { ...item("a"), ...change } });
    });

    it("deletes a single record", async () => {
        storage.get.mockResolvedValue({ a: item("a"), b: item("b") });

        await repository.delete("a");

        expect(storage.set).toHaveBeenCalledWith(key, { b: item("b") });
    });

    it("clears its storage key", async () => {
        await repository.clear();

        expect(storage.remove).toHaveBeenCalledWith(key);
    });
});

describe("AnimeMetadataRepository.replaceAll", () => {
    it("writes the given entries as the whole record", async () => {
        storage.set.mockResolvedValue(undefined);

        await new AnimeMetadataRepository().replaceAll([metadata("a"), metadata("b")]);

        expect(storage.set).toHaveBeenCalledWith(StorageKeys.ANIME_METADATA, { a: metadata("a"), b: metadata("b") });
    });
});
