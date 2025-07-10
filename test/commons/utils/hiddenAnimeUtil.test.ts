import { StorageKeys } from "@/commons/models";
import { HiddenAnimeUtil } from "@/commons/utils/hiddenAnimeUtil";
import { ArrayStorageUtil } from "@/commons/utils/storageUtil";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage utility
vi.mock("@/commons/utils/storageUtil");
const mockArrayStorageUtil = vi.mocked(ArrayStorageUtil);

describe("HiddenAnimeUtil", () => {
    const mockHiddenList = ["123", "456", "789"];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAll", () => {
        it("should return all hidden anime IDs", async () => {
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            const result = await HiddenAnimeUtil.getAll();

            expect(mockArrayStorageUtil.getAll).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME);
            expect(result).toEqual(mockHiddenList);
        });
    });

    describe("add", () => {
        it("should add anime to hidden list if not already hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(false);
            mockArrayStorageUtil.add.mockResolvedValue(undefined);

            await HiddenAnimeUtil.add("999");

            expect(mockArrayStorageUtil.exists).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, expect.any(Function));
            expect(mockArrayStorageUtil.add).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, "999");
        });

        it("should not add anime if already hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(true);

            await HiddenAnimeUtil.add("123");

            expect(mockArrayStorageUtil.add).not.toHaveBeenCalled();
        });
    });

    describe("remove", () => {
        it("should remove anime from hidden list", async () => {
            mockArrayStorageUtil.remove.mockResolvedValue(undefined);

            await HiddenAnimeUtil.remove("123");

            expect(mockArrayStorageUtil.remove).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, expect.any(Function));
        });
    });

    describe("isHidden", () => {
        it("should return true if anime is hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(true);

            const result = await HiddenAnimeUtil.isHidden("123");

            expect(mockArrayStorageUtil.exists).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, expect.any(Function));
            expect(result).toBe(true);
        });

        it("should return false if anime is not hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(false);

            const result = await HiddenAnimeUtil.isHidden("999");

            expect(result).toBe(false);
        });
    });

    describe("toggle", () => {
        it("should hide anime if not currently hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(false);
            mockArrayStorageUtil.add.mockResolvedValue(undefined);

            const result = await HiddenAnimeUtil.toggle("999");

            expect(mockArrayStorageUtil.add).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, "999");
            expect(result).toBe(true);
        });

        it("should unhide anime if currently hidden", async () => {
            mockArrayStorageUtil.exists.mockResolvedValue(true);
            mockArrayStorageUtil.remove.mockResolvedValue(undefined);

            const result = await HiddenAnimeUtil.toggle("123");

            expect(mockArrayStorageUtil.remove).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME, expect.any(Function));
            expect(result).toBe(false);
        });
    });

    describe("clear", () => {
        it("should clear all hidden anime", async () => {
            mockArrayStorageUtil.clear.mockResolvedValue(undefined);

            await HiddenAnimeUtil.clear();

            expect(mockArrayStorageUtil.clear).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME);
        });
    });

    describe("getCount", () => {
        it("should return count of hidden anime", async () => {
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            const result = await HiddenAnimeUtil.getCount();

            expect(result).toBe(3);
        });
    });

    describe("addMultiple", () => {
        it("should add multiple new anime to hidden list", async () => {
            const newIds = ["999", "888", "777"];
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);
            mockArrayStorageUtil.clear.mockResolvedValue(undefined);
            mockArrayStorageUtil.add.mockResolvedValue(undefined);

            await HiddenAnimeUtil.addMultiple(newIds);

            expect(mockArrayStorageUtil.clear).toHaveBeenCalledWith(StorageKeys.HIDDEN_ANIME);
            // Should be called for each ID in the combined list
            expect(mockArrayStorageUtil.add).toHaveBeenCalledTimes(6);
        });

        it("should not add duplicate anime IDs", async () => {
            const duplicateIds = ["123", "456"]; // Already in mockHiddenList
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            await HiddenAnimeUtil.addMultiple(duplicateIds);

            expect(mockArrayStorageUtil.clear).not.toHaveBeenCalled();
            expect(mockArrayStorageUtil.add).not.toHaveBeenCalled();
        });
    });

    describe("removeMultiple", () => {
        it("should remove multiple anime from hidden list", async () => {
            const idsToRemove = ["123", "456"];
            mockArrayStorageUtil.remove.mockResolvedValue(undefined);

            await HiddenAnimeUtil.removeMultiple(idsToRemove);

            expect(mockArrayStorageUtil.remove).toHaveBeenCalledTimes(2);
        });
    });

    describe("hasAnyHidden", () => {
        it("should return true if any anime in list is hidden", async () => {
            const checkIds = ["999", "123", "888"]; // '123' is in hidden list
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            const result = await HiddenAnimeUtil.hasAnyHidden(checkIds);

            expect(result).toBe(true);
        });

        it("should return false if no anime in list is hidden", async () => {
            const checkIds = ["999", "888", "777"];
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            const result = await HiddenAnimeUtil.hasAnyHidden(checkIds);

            expect(result).toBe(false);
        });
    });

    describe("filterHidden", () => {
        it("should filter out hidden anime from list", async () => {
            const allIds = ["123", "999", "456", "888"];
            mockArrayStorageUtil.getAll.mockResolvedValue(mockHiddenList);

            const result = await HiddenAnimeUtil.filterHidden(allIds);

            expect(result).toEqual(["999", "888"]);
        });
    });
});
