import HomeView from "@/options/views/HomeView.vue";
import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Toast, { useToast } from "vue-toastification";

// Smoke test to ensure vue-toastification plugin integrates without runtime errors in jsdom.

describe("toast integration", () => {
    beforeEach(() => {
        // reset any existing toasts
        const toast = useToast();
        // Attempt to clear existing toasts if API exposed
        // @ts-ignore
        toast.clearAll && toast.clearAll();
    });

    it("mounts HomeView with toast plugin without errors", async () => {
        const wrapper = mount(HomeView, {
            global: {
                plugins: [createTestingPinia({ createSpy: vi.fn }), Toast],
            },
        });
        expect(wrapper.find("[data-testid=home-view]").exists()).toBe(true);
    });
});
