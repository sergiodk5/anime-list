import { executeWithRetry, toActionFailure } from "@/options/commons/errorHandling";
import type { StoreActionResult } from "@/options/stores/types";
import { useToast } from "vue-toastification";

export interface StoreActionConfig<TServiceResult = any> {
    run: () => Promise<TServiceResult>;
    expectSuccessField?: boolean;
    onOptimistic?: () => void;
    onRollback?: () => void;
    onSuccessApply?: (serviceResult: TServiceResult) => void;
    successToast?: string | ((serviceResult: TServiceResult) => string);
    errorToast?: string | ((message: string) => string);
    retries?: number;
    baseDelayMs?: number;
    setLastError?: (msg: string | null) => void;
}

export async function runStoreAction<TServiceResult = any>(
    config: StoreActionConfig<TServiceResult>,
): Promise<StoreActionResult> {
    const {
        run,
        expectSuccessField = true,
        onOptimistic,
        onRollback,
        onSuccessApply,
        successToast,
        errorToast,
        retries = 2,
        baseDelayMs = 300,
        setLastError,
    } = config;

    const toast = useToast();
    setLastError?.(null);

    try {
        onOptimistic?.();
        const serviceResult: any = await executeWithRetry(run, retries, baseDelayMs);

        let isSuccess = true;
        let message: string | undefined = undefined;
        if (expectSuccessField) {
            isSuccess = Boolean(serviceResult?.success);
            message = serviceResult?.message;
        }

        if (!isSuccess) {
            onRollback?.();
            setLastError?.(message || "Action failed");
            const errMsg = errorToast
                ? typeof errorToast === "function"
                    ? errorToast(message || "")
                    : errorToast
                : message;
            if (errMsg) toast.error(errMsg);
            return { success: false, error: message };
        }

        onSuccessApply?.(serviceResult);
        const okMsg = successToast
            ? typeof successToast === "function"
                ? successToast(serviceResult)
                : successToast
            : message;
        if (okMsg) toast.success(okMsg);
        return { success: true };
    } catch (error) {
        onRollback?.();
        const failure = toActionFailure(error);
        setLastError?.(failure.error || null);
        const errMsg = failure.error || "Action failed";
        const toastMsg = errorToast ? (typeof errorToast === "function" ? errorToast(errMsg) : errorToast) : errMsg;
        toast.error(toastMsg);
        return failure;
    }
}
