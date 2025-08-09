import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const executeWithRetryMock = vi.fn((fn: any) => fn());
const toActionFailureMock = vi.fn((err: any) => ({ success: false, error: (err && err.message) || "boom" }));

vi.mock("@/options/commons/errorHandling", () => ({
    executeWithRetry: (fn: any) => executeWithRetryMock(fn),
    toActionFailure: (err: any) => toActionFailureMock(err),
}));

import { runStoreAction, type StoreActionConfig } from "@/options/commons/actionHelpers";

describe("runStoreAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("handles explicit service failure (success=false) with rollback and error toast", async () => {
        const rollback = vi.fn();
        const setLastError = vi.fn();
        const cfg: StoreActionConfig<any> = {
            run: async () => ({ success: false, message: "Nope" }),
            onRollback: rollback,
            errorToast: (m) => `ERR:${m}`,
            setLastError,
        };
        const res = await runStoreAction(cfg);
        expect(res.success).toBe(false);
        expect(rollback).toHaveBeenCalled();
        expect(setLastError).toHaveBeenCalledWith("Nope");
    });

    it("applies success path with success toast", async () => {
        const apply = vi.fn();
        const cfg: StoreActionConfig<any> = {
            run: async () => ({ success: true, message: "Yay" }),
            onSuccessApply: apply,
            successToast: (r) => `OK:${r.message}`,
        };
        const res = await runStoreAction(cfg);
        expect(res.success).toBe(true);
        expect(apply).toHaveBeenCalled();
    });

    it("catches thrown error, performs rollback, sets lastError and uses errorToast override", async () => {
        const rollback = vi.fn();
        const setLastError = vi.fn();
        const cfg: StoreActionConfig<any> = {
            run: async () => {
                throw new Error("network down");
            },
            onRollback: rollback,
            errorToast: "Hard fail",
            setLastError,
        };
        const res = await runStoreAction(cfg);
        expect(res.success).toBe(false);
        expect(rollback).toHaveBeenCalled();
        expect(setLastError).toHaveBeenCalledWith(expect.any(String));
    });
});
