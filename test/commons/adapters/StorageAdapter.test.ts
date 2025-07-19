import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock chrome.storage.local
const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
};

const mockRuntime = {
    lastError: null as any,
};

// Global chrome mock
(global as any).chrome = {
    storage: {
        local: mockStorage,
    },
    runtime: mockRuntime,
};

describe("StorageAdapter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRuntime.lastError = null;
    });

    describe("get", () => {
        it("should get data from storage successfully", async () => {
            const testData = { key1: "value1" };
            mockStorage.get.mockImplementation((key, callback) => {
                callback({ [key]: testData });
            });

            const result = await StorageAdapter.get("testKey");

            expect(result).toEqual(testData);
            expect(mockStorage.get).toHaveBeenCalledWith("testKey", expect.any(Function));
        });

        it("should return null for non-existent data", async () => {
            mockStorage.get.mockImplementation((key, callback) => {
                callback({});
            });

            const result = await StorageAdapter.get("nonExistentKey");

            expect(result).toBeNull();
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.get.mockImplementation((key, callback) => {
                callback({});
            });

            await expect(StorageAdapter.get("testKey")).rejects.toThrow("Storage error");
        });
    });

    describe("set", () => {
        it("should set data in storage successfully", async () => {
            mockStorage.set.mockImplementation((data, callback) => {
                callback();
            });

            await expect(StorageAdapter.set("testKey", "testValue")).resolves.toBeUndefined();
            expect(mockStorage.set).toHaveBeenCalledWith({ testKey: "testValue" }, expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.set.mockImplementation((data, callback) => {
                callback();
            });

            await expect(StorageAdapter.set("testKey", "testValue")).rejects.toThrow("Storage error");
        });
    });

    describe("remove", () => {
        it("should remove data from storage successfully", async () => {
            mockStorage.remove.mockImplementation((key, callback) => {
                callback();
            });

            await expect(StorageAdapter.remove("testKey")).resolves.toBeUndefined();
            expect(mockStorage.remove).toHaveBeenCalledWith("testKey", expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.remove.mockImplementation((key, callback) => {
                callback();
            });

            await expect(StorageAdapter.remove("testKey")).rejects.toThrow("Storage error");
        });
    });

    describe("clear", () => {
        it("should clear all storage data successfully", async () => {
            mockStorage.clear.mockImplementation((callback) => {
                callback();
            });

            await expect(StorageAdapter.clear()).resolves.toBeUndefined();
            expect(mockStorage.clear).toHaveBeenCalledWith(expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.clear.mockImplementation((callback) => {
                callback();
            });

            await expect(StorageAdapter.clear()).rejects.toThrow("Storage error");
        });
    });

    describe("getMultiple", () => {
        it("should get multiple keys successfully", async () => {
            const testData = { key1: "value1", key2: "value2" };
            mockStorage.get.mockImplementation((keys, callback) => {
                callback(testData);
            });

            const result = await StorageAdapter.getMultiple(["key1", "key2"]);

            expect(result).toEqual(testData);
            expect(mockStorage.get).toHaveBeenCalledWith(["key1", "key2"], expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.get.mockImplementation((keys, callback) => {
                callback({});
            });

            await expect(StorageAdapter.getMultiple(["key1", "key2"])).rejects.toThrow("Storage error");
        });
    });

    describe("setMultiple", () => {
        it("should set multiple key-value pairs successfully", async () => {
            const testData = { key1: "value1", key2: "value2" };
            mockStorage.set.mockImplementation((data, callback) => {
                callback();
            });

            await expect(StorageAdapter.setMultiple(testData)).resolves.toBeUndefined();
            expect(mockStorage.set).toHaveBeenCalledWith(testData, expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.set.mockImplementation((data, callback) => {
                callback();
            });

            await expect(StorageAdapter.setMultiple({ key1: "value1" })).rejects.toThrow("Storage error");
        });
    });

    describe("removeMultiple", () => {
        it("should remove multiple keys successfully", async () => {
            const keys = ["key1", "key2"];
            mockStorage.remove.mockImplementation((keys, callback) => {
                callback();
            });

            await expect(StorageAdapter.removeMultiple(keys)).resolves.toBeUndefined();
            expect(mockStorage.remove).toHaveBeenCalledWith(keys, expect.any(Function));
        });

        it("should reject when there's a chrome runtime error", async () => {
            mockRuntime.lastError = new Error("Storage error");
            mockStorage.remove.mockImplementation((keys, callback) => {
                callback();
            });

            await expect(StorageAdapter.removeMultiple(["key1", "key2"])).rejects.toThrow("Storage error");
        });
    });
});
