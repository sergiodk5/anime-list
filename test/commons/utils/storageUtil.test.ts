import { ArrayStorageUtil, RecordStorageUtil, StorageUtil } from "@/commons/utils/storageUtil";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Chrome APIs
const mockChromeStorage = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).chrome = {
    storage: mockChromeStorage,
    runtime: { lastError: null },
};

describe("StorageUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global as any).chrome.runtime.lastError = null;
    });

    describe("get", () => {
        it("should get data from storage", async () => {
            const mockData = { test: "value" };
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockData });
            });

            const result = await StorageUtil.get("testKey");

            expect(mockChromeStorage.local.get).toHaveBeenCalledWith("testKey", expect.any(Function));
            expect(result).toEqual(mockData);
        });

        it("should return null if data not found", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({});
            });

            const result = await StorageUtil.get("nonexistent");

            expect(result).toBeNull();
        });

        it("should reject on Chrome runtime error", async () => {
            const error = new Error("Storage error");
            (global as any).chrome.runtime.lastError = error;
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({});
            });

            await expect(StorageUtil.get("testKey")).rejects.toThrow(error);
        });
    });

    describe("set", () => {
        it("should set data in storage", async () => {
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await StorageUtil.set("testKey", "testValue");

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ testKey: "testValue" }, expect.any(Function));
        });

        it("should reject on Chrome runtime error", async () => {
            const error = new Error("Storage error");
            (global as any).chrome.runtime.lastError = error;
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await expect(StorageUtil.set("testKey", "testValue")).rejects.toThrow(error);
        });
    });

    describe("remove", () => {
        it("should remove data from storage", async () => {
            mockChromeStorage.local.remove.mockImplementation((key, callback) => {
                callback();
            });

            await StorageUtil.remove("testKey");

            expect(mockChromeStorage.local.remove).toHaveBeenCalledWith("testKey", expect.any(Function));
        });

        it("should reject on Chrome runtime error", async () => {
            const error = new Error("Remove error");
            mockChromeStorage.local.remove.mockImplementation((key, callback) => {
                (global as any).chrome.runtime.lastError = error;
                callback();
            });

            await expect(StorageUtil.remove("testKey")).rejects.toThrow("Remove error");
        });
    });

    describe("clear", () => {
        it("should clear all storage data", async () => {
            mockChromeStorage.local.clear.mockImplementation((callback) => {
                callback();
            });

            await StorageUtil.clear();

            expect(mockChromeStorage.local.clear).toHaveBeenCalledWith(expect.any(Function));
        });

        it("should reject on Chrome runtime error", async () => {
            const error = new Error("Clear error");
            mockChromeStorage.local.clear.mockImplementation((callback) => {
                (global as any).chrome.runtime.lastError = error;
                callback();
            });

            await expect(StorageUtil.clear()).rejects.toThrow("Clear error");
        });
    });
});

describe("RecordStorageUtil", () => {
    const testKey = "testRecords";
    let mockRecord: Record<string, any>;

    beforeEach(() => {
        vi.clearAllMocks();
        (global as any).chrome.runtime.lastError = null;
        // Reset mock data for each test
        mockRecord = { id1: { name: "Item 1" }, id2: { name: "Item 2" } };
    });

    describe("getAll", () => {
        it("should return all records", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.getAll(testKey);

            expect(result).toEqual(mockRecord);
        });

        it("should return empty object if no records", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({});
            });

            const result = await RecordStorageUtil.getAll(testKey);

            expect(result).toEqual({});
        });
    });

    describe("getById", () => {
        it("should return specific record by ID", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.getById(testKey, "id1");

            expect(result).toEqual({ name: "Item 1" });
        });

        it("should return null if record not found", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.getById(testKey, "nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("save", () => {
        it("should save record with ID", async () => {
            const newItem = { name: "New Item" };
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await RecordStorageUtil.save(testKey, "id3", newItem);

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
                { [testKey]: { ...mockRecord, id3: newItem } },
                expect.any(Function),
            );
        });
    });

    describe("delete", () => {
        it("should delete record by ID", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await RecordStorageUtil.delete(testKey, "id1");

            const expectedRecord = { id2: { name: "Item 2" } };
            expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
                { [testKey]: expectedRecord },
                expect.any(Function),
            );
        });
    });

    describe("getAllAsArray", () => {
        it("should return all records as array", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.getAllAsArray(testKey);

            expect(result).toEqual(Object.values(mockRecord));
        });
    });

    describe("exists", () => {
        it("should return true if record exists", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.exists(testKey, "id1");

            expect(result).toBe(true);
        });

        it("should return false if record does not exist", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockRecord });
            });

            const result = await RecordStorageUtil.exists(testKey, "nonexistent");

            expect(result).toBe(false);
        });
    });

    describe("clear", () => {
        it("should clear all records", async () => {
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await RecordStorageUtil.clear(testKey);

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ [testKey]: {} }, expect.any(Function));
        });
    });
});

describe("ArrayStorageUtil", () => {
    const testKey = "testArray";
    let mockArray: string[];

    beforeEach(() => {
        vi.clearAllMocks();
        (global as any).chrome.runtime.lastError = null;
        // Reset mock data for each test
        mockArray = ["item1", "item2", "item3"];
    });

    describe("getAll", () => {
        it("should return all items", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });

            const result = await ArrayStorageUtil.getAll(testKey);

            expect(result).toEqual(mockArray);
        });

        it("should return empty array if no items", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({});
            });

            const result = await ArrayStorageUtil.getAll(testKey);

            expect(result).toEqual([]);
        });
    });

    describe("add", () => {
        it("should add item to array", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await ArrayStorageUtil.add(testKey, "newItem");

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
                { [testKey]: [...mockArray, "newItem"] },
                expect.any(Function),
            );
        });
    });

    describe("remove", () => {
        it("should remove items matching predicate", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await ArrayStorageUtil.remove(testKey, (item) => item === "item2");

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
                { [testKey]: ["item1", "item3"] },
                expect.any(Function),
            );
        });
    });

    describe("find", () => {
        it("should find item matching predicate", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });

            const result = await ArrayStorageUtil.find(testKey, (item) => item === "item2");

            expect(result).toBe("item2");
        });

        it("should return undefined if item not found", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });

            const result = await ArrayStorageUtil.find(testKey, (item) => item === "nonexistent");

            expect(result).toBeUndefined();
        });
    });

    describe("exists", () => {
        it("should return true if item exists", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });

            const result = await ArrayStorageUtil.exists(testKey, (item) => item === "item2");

            expect(result).toBe(true);
        });

        it("should return false if item does not exist", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });

            const result = await ArrayStorageUtil.exists(testKey, (item) => item === "nonexistent");

            expect(result).toBe(false);
        });
    });

    describe("update", () => {
        it("should update items matching predicate", async () => {
            mockChromeStorage.local.get.mockImplementation((key, callback) => {
                callback({ [key as string]: mockArray });
            });
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await ArrayStorageUtil.update(
                testKey,
                (item) => item === "item2",
                () => "updated-item2",
            );

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith(
                { [testKey]: ["item1", "updated-item2", "item3"] },
                expect.any(Function),
            );
        });
    });

    describe("clear", () => {
        it("should clear all items", async () => {
            mockChromeStorage.local.set.mockImplementation((data, callback) => {
                callback();
            });

            await ArrayStorageUtil.clear(testKey);

            expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ [testKey]: [] }, expect.any(Function));
        });
    });
});
