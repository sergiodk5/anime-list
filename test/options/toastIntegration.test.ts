import HomeView from "@/options/views/HomeView.vue";
import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import Vue3Toastify from "vue3-toastify";

describe("toast integration", () => {
    it("mounts HomeView with the toast plugin without errors", async () => {
        const wrapper = mount(HomeView, {
            global: {
                plugins: [createTestingPinia({ createSpy: vi.fn }), [Vue3Toastify, { autoClose: 4000 }]],
            },
        });
        expect(wrapper.find("[data-testid=home-view]").exists()).toBe(true);
    });
});
