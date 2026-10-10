import type { StoreActionResult } from "@/options/stores/types";

export type ClassifiedErrorCode =
    | "STORAGE_UNAVAILABLE"
    | "NETWORK_ERROR"
    | "VALIDATION_ERROR"
    | "PERMISSION_DENIED"
    | "NOT_FOUND"
    | "GENERIC_ERROR";

export const ERROR_MESSAGES: Record<ClassifiedErrorCode, string> = {
    STORAGE_UNAVAILABLE: "Storage is temporarily unavailable. Please try again.",
    NETWORK_ERROR: "Network issue. Check your connection.",
    VALIDATION_ERROR: "Invalid data provided.",
    PERMISSION_DENIED: "Permission denied. Check extension settings.",
    NOT_FOUND: "Requested item was not found.",
    GENERIC_ERROR: "An unexpected error occurred.",
};

export function classifyError(err: unknown): ClassifiedErrorCode {
    if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("storage")) return "STORAGE_UNAVAILABLE";
        if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) return "NETWORK_ERROR";
        if (msg.includes("validation") || msg.includes("invalid")) return "VALIDATION_ERROR";
        if (msg.includes("denied") || msg.includes("forbidden") || msg.includes("permission"))
            return "PERMISSION_DENIED";
        if (msg.includes("not found") || msg.includes("missing")) return "NOT_FOUND";
    }
    return "GENERIC_ERROR";
}

export function toActionFailure(err: unknown): StoreActionResult {
    const code = classifyError(err);
    return { success: false, error: ERROR_MESSAGES[code] };
}

export async function executeWithRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 300): Promise<T> {
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= retries) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (attempt === retries) break;
            const delay = baseDelayMs * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
            attempt++;
        }
    }
    throw lastError;
}
