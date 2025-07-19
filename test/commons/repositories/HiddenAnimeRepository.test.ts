import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import { StorageKeys } from "@/commons/models";
import { HiddenAnimeRepository } from "@/commons/repositories/HiddenAnimeRepository";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the StorageAdapter
vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
}));

type MockStorageAdapter = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
};

const mockStorageAdapter = StorageAdapter as unknown as MockStorageAdapter;

describe("HiddenAnimeRepository", () => {
    let repository: HiddenAnimeRepository;
    const testAnimeId = "123";

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new HiddenAnimeRepository();
    });

    describe("create", () => {
        it("should add anime ID to hidden list", async () => {
            const existingHidden = ["456", "789"];
            mockStorageAdapter.get.mockResolvedValue(existingHidden);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(testAnimeId);

            expect(mockStorageAdapter.get).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME);
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456", "789", "123"]);
        });

        it("should not add duplicate anime ID", async () => {
            const existingHidden = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(existingHidden);

            await repository.create(testAnimeId);

            expect(mockStorageAdapter.set).not.toHaveBeenCalled();
        });

        it("should handle empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(testAnimeId);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["123"]);
        });
    });

    describe("findById", () => {
        it("should find anime ID if hidden", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.findById("123");

            expect(result).toBe("123");
        });

        it("should return null for non-hidden anime", async () => {
            const hiddenList = ["456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.findById("999");

            expect(result).toBeNull();
        });

        it("should handle empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.findById("123");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all hidden anime IDs", async () => {
            const hiddenList = ["123", "456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.findAll();

            expect(result).toEqual(hiddenList);
        });

        it("should return empty array for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe("update", () => {
        it("should throw an error as update is not supported", async () => {
            await expect(repository.update("123", "updated")).rejects.toThrow(
                "Update operation is not supported for HiddenAnimeRepository",
            );

            // Ensure no storage operations were attempted
            expect(mockStorageAdapter.set).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should remove anime ID from hidden list", async () => {
            const hiddenList = ["123", "456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.delete("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456", "789"]);
        });

        it("should handle removing non-existent ID", async () => {
            const hiddenList = ["456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.delete("999");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456", "789"]);
        });
    });

    describe("exists", () => {
        it("should return true for existing anime", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.exists("123");

            expect(result).toBe(true);
        });

        it("should return false for non-existent anime", async () => {
            const hiddenList = ["456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.exists("999");

            expect(result).toBe(false);
        });
    });

    describe("clear", () => {
        it("should clear all hidden anime", async () => {
            mockStorageAdapter.remove.mockResolvedValue(undefined);

            await repository.clear();

            expect(mockStorageAdapter.remove).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME);
        });
    });

    describe("count", () => {
        it("should return count of hidden anime", async () => {
            const hiddenList = ["123", "456", "789"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.count();

            expect(result).toBe(3);
        });

        it("should return 0 for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.count();

            expect(result).toBe(0);
        });
    });

    describe("add", () => {
        it("should add anime to hidden list", async () => {
            const existingHidden = ["456"];
            mockStorageAdapter.get.mockResolvedValue(existingHidden);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.add(testAnimeId);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456", "123"]);
        });
    });

    describe("remove", () => {
        it("should remove anime from hidden list", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.remove("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456"]);
        });
    });

    describe("toggle", () => {
        it("should add anime if not hidden", async () => {
            const hiddenList = ["456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            const result = await repository.toggle("123");

            expect(result).toBe(true);
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456", "123"]);
        });

        it("should remove anime if hidden", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            const result = await repository.toggle("123");

            expect(result).toBe(false);
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, ["456"]);
        });
    });

    describe("compatibility methods", () => {
        it("should support isHidden method", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.isHidden("123");

            expect(result).toBe(true);
        });

        it("should support getAll method", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.getAll();

            expect(result).toEqual(hiddenList);
        });

        it("should support getCount method", async () => {
            const hiddenList = ["123", "456"];
            mockStorageAdapter.get.mockResolvedValue(hiddenList);

            const result = await repository.getCount();

            expect(result).toBe(2);
        });
    });
});
