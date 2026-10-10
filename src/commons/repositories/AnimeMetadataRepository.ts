import type { AnimeMetadata } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for external metadata (episode totals, airing schedule) per anime
 */
export class AnimeMetadataRepository extends BaseRepository<AnimeMetadata> {
    constructor() {
        super(StorageKeys.ANIME_METADATA);
    }

    async create(metadata: AnimeMetadata): Promise<void> {
        const all = await this.getAllAsRecord();
        all[metadata.animeId] = metadata;
        await this.setAllAsRecord(all);
    }

    async findById(animeId: string): Promise<AnimeMetadata | null> {
        const all = await this.getAllAsRecord();
        return all[animeId] || null;
    }

    async findAll(): Promise<AnimeMetadata[]> {
        const all = await this.getAllAsRecord();
        return Object.values(all);
    }

    async update(animeId: string, data: Partial<AnimeMetadata>): Promise<void> {
        const all = await this.getAllAsRecord();
        if (all[animeId]) {
            all[animeId] = { ...all[animeId], ...data };
            await this.setAllAsRecord(all);
        }
    }

    async delete(animeId: string): Promise<void> {
        const all = await this.getAllAsRecord();
        delete all[animeId];
        await this.setAllAsRecord(all);
    }

    async exists(animeId: string): Promise<boolean> {
        const all = await this.getAllAsRecord();
        return animeId in all;
    }

    async clear(): Promise<void> {
        await this.clearStorage();
    }

    async count(): Promise<number> {
        const all = await this.getAllAsRecord();
        return Object.keys(all).length;
    }

    /**
     * Replace all metadata in a single write
     */
    async replaceAll(entries: AnimeMetadata[]): Promise<void> {
        const all: Record<string, AnimeMetadata> = {};
        entries.forEach((entry) => {
            all[entry.animeId] = entry;
        });
        await this.setAllAsRecord(all);
    }
}
