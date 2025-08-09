import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

import { createPiniaApp, setupPinia } from "@/options/stores";

describe("stores/index", () => {
    describe("createPiniaApp", () => {
        it("should create a Pinia instance", () => {
            const pinia = createPiniaApp();

            expect(pinia).toBeDefined();
            expect(typeof pinia.install).toBe("function"); // Pinia instance has install method
        });

        it("should create different instances on each call", () => {
            const pinia1 = createPiniaApp();
            const pinia2 = createPiniaApp();

            expect(pinia1).not.toBe(pinia2);
        });
    });

    describe("setupPinia", () => {
        let app: ReturnType<typeof createApp>;

        beforeEach(() => {
            // Create a minimal Vue app for testing
            app = createApp({ template: "<div>test</div>" });
        });

        it("should setup Pinia with the Vue app", () => {
            // Mock the app.use method to verify it's called
            const useSpy = vi.fn();
            app.use = useSpy;

            setupPinia(app);

            expect(useSpy).toHaveBeenCalledTimes(1);
            expect(useSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    install: expect.any(Function),
                }),
            );
        });

        it("should be callable without errors", () => {
            expect(() => setupPinia(app)).not.toThrow();
        });
    });
});
