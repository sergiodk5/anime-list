/**
 * Toast notification system for the content script
 * Provides singleton pattern for managing toast notifications
 */

import type { Toast } from "../../types/ContentTypes";

export class ToastSystem {
    private static instance: ToastSystem | null = null;
    private toastCounter = 0;
    private activeToasts = new Map<string, Toast>();

    private constructor() {}

    static getInstance(): ToastSystem {
        if (!ToastSystem.instance) {
            ToastSystem.instance = new ToastSystem();
        }
        return ToastSystem.instance;
    }

    showToast(message: string, type: "success" | "error" | "info"): void {
        // Skip toast creation in test environment
        if (typeof window === "undefined" || !window.document || (globalThis as any).vitest) {
            return;
        }

        const toastId = `toast-${this.toastCounter++}`;

        const toast = document.createElement("div");
        toast.className = `anime-list-toast anime-list-toast-${type}`;
        toast.setAttribute("data-testid", "anime-toast");
        toast.setAttribute("data-toast-id", toastId);
        toast.textContent = message;

        // Position toast in top-right corner
        toast.style.position = "fixed";
        toast.style.top = `${16 + this.activeToasts.size * 70}px`; // Stack toasts
        toast.style.right = "16px";
        toast.style.zIndex = "10001";
        toast.style.maxWidth = "300px";

        document.body.appendChild(toast);

        // Store toast reference
        const toastData: Toast = {
            id: toastId,
            message,
            type,
            element: toast,
        };
        this.activeToasts.set(toastId, toastData);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            this.removeToast(toastId);
        }, 4000);

        // Add slide-in animation
        toast.style.transform = "translateX(100%)";
        setTimeout(() => {
            toast.style.transform = "translateX(0)";
        }, 50);
    }

    private removeToast(toastId: string): void {
        const toastData = this.activeToasts.get(toastId);
        if (!toastData) return;

        // Slide-out animation
        toastData.element.style.transform = "translateX(100%)";

        setTimeout(() => {
            toastData.element.remove();
            this.activeToasts.delete(toastId);

            // Reposition remaining toasts
            this.repositionToasts();
        }, 300);
    }

    private repositionToasts(): void {
        let index = 0;
        this.activeToasts.forEach((toast) => {
            toast.element.style.top = `${16 + index * 70}px`;
            index++;
        });
    }
}

// Export singleton instance
export const toastSystem = ToastSystem.getInstance();
