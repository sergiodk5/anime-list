import { classifyError, executeWithRetry, toActionFailure } from "@/options/commons/errorHandling";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("errorHandling utilities", () => {
    describe("classifyError", () => {
        it("classifies storage errors", () => {
            expect(classifyError(new Error("Storage unavailable"))).toBe("STORAGE_UNAVAILABLE");
        });
        it("classifies network errors", () => {
            expect(classifyError(new Error("Network timeout"))).toBe("NETWORK_ERROR");
        });
        it("classifies validation errors", () => {
            expect(classifyError(new Error("Invalid payload"))).toBe("VALIDATION_ERROR");
        });
        it("classifies permission errors", () => {
            expect(classifyError(new Error("Permission denied"))).toBe("PERMISSION_DENIED");
        });
        it("classifies not found errors", () => {
            expect(classifyError(new Error("Item not found"))).toBe("NOT_FOUND");
        });
        it("falls back to generic", () => {
            expect(classifyError(new Error("Weird mystical issue"))).toBe("GENERIC_ERROR");
        });
    });

    describe("toActionFailure", () => {
        it("returns mapped error message", () => {
            const failure = toActionFailure(new Error("storage adapter fail"));
            expect(failure.success).toBe(false);
            expect(failure.error).toBeDefined();
        });
    });

    describe("executeWithRetry", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });
        it("retries failing operation then succeeds", async () => {
            let call = 0;
            const fn = vi.fn().mockImplementation(() => {
                call++;
                if (call < 3) throw new Error("fail");
                return Promise.resolve("ok");
            });
            const promise = executeWithRetry(fn, 3, 5);
            await vi.runAllTimersAsync();
            const result = await promise;
            expect(result).toBe("ok");
            expect(fn).toHaveBeenCalledTimes(3);
        });
        it("throws after exhausting retries", async () => {
            vi.useRealTimers();
            const fn = vi.fn().mockImplementation(() => {
                return Promise.reject(new Error("always"));
            });
            try {
                await executeWithRetry(fn, 1, 5);
                throw new Error("did not throw");
            } catch (e: any) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toBe("always");
            }
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
