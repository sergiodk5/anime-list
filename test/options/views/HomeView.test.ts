import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useHiddenStore } from "@/options/stores/hiddenStore";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";
import HomeView from "@/options/views/HomeView.vue";

// Mock the stores
vi.mock("@/options/stores/watchingStore");
vi.mock("@/options/stores/planToWatchStore");
vi.mock("@/options/stores/hiddenStore");

describe("HomeView - Phase 4 Store Integration", () => {
    let pinia: ReturnType<typeof createPinia>;

    const mockWatchingStore = {
        count: ref(5),
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    const mockPlanToWatchStore = {
        count: ref(12),
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    const mockHiddenStore = {
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        // Reset mocks
        vi.clearAllMocks();

        // Reset reactive values
        mockWatchingStore.count.value = 5;
        mockWatchingStore.isLoading.value = false;
        mockWatchingStore.hasError = false;

        mockPlanToWatchStore.count.value = 12;
        mockPlanToWatchStore.isLoading.value = false;
        mockPlanToWatchStore.hasError = false;

        mockHiddenStore.hasError = false;

        // Mock store implementations
        vi.mocked(useWatchingStore).mockReturnValue(mockWatchingStore as any);
        vi.mocked(usePlanToWatchStore).mockReturnValue(mockPlanToWatchStore as any);
        vi.mocked(useHiddenStore).mockReturnValue(mockHiddenStore as any);
    });

    describe("Store Integration", () => {
        it("should display reactive watching count from store", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toBe("5");
        });

        it("should display reactive plan to watch count from store", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toBe("12");
        });

        it("should initialize all stores on mount", async () => {
            mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await vi.waitFor(() => {
                expect(mockWatchingStore.init).toHaveBeenCalled();
                expect(mockPlanToWatchStore.init).toHaveBeenCalled();
                expect(mockHiddenStore.init).toHaveBeenCalled();
            });
        });
    });

    describe("Loading States", () => {
        it("should show loading skeletons when stores are loading", async () => {
            // Mock loading state
            mockWatchingStore.isLoading.value = true;

            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(true);
            // Should contain skeleton card(s)
            // There is no loading text now
            expect(loadingState.text().trim()).toBe("");

            const mainContent = wrapper.find('[data-testid="welcome-section"]');
            expect(mainContent.exists()).toBe(false);
        });

        it("should hide loading state when stores finish loading", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(false);

            const mainContent = wrapper.find('[data-testid="welcome-section"]');
            expect(mainContent.exists()).toBe(true);
        });
    });

    describe("Error States", () => {
        it("should show error state when stores have errors", async () => {
            mockWatchingStore.hasError = true;

            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const errorState = wrapper.find('[data-testid="error-state"]');
            expect(errorState.exists()).toBe(true);
            expect(errorState.text()).toContain("Unable to Load Data");

            const mainContent = wrapper.find('[data-testid="welcome-section"]');
            expect(mainContent.exists()).toBe(false);
        });

        it("should show main content when no stores have errors", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const errorState = wrapper.find('[data-testid="error-state"]');
            expect(errorState.exists()).toBe(false);

            const mainContent = wrapper.find('[data-testid="welcome-section"]');
            expect(mainContent.exists()).toBe(true);
        });
    });

    describe("Reactive Count Updates", () => {
        it("should update watching count when store count changes", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Initial count
            let watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toBe("5");

            // Update store count
            mockWatchingStore.count.value = 8;
            await wrapper.vm.$nextTick();

            // Verify updated count
            watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toBe("8");
        });

        it("should update plan to watch count when store count changes", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Initial count
            let plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toBe("12");

            // Update store count
            mockPlanToWatchStore.count.value = 15;
            await wrapper.vm.$nextTick();

            // Verify updated count
            plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toBe("15");
        });
    });

    describe("UI Preservation", () => {
        it("should maintain original UI elements and styling", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Check key UI elements still exist
            expect(wrapper.find('[data-testid="welcome-section"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stats-section"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="actions-section"]').exists()).toBe(true);

            // Check stat cards exist
            expect(wrapper.find('[data-testid="stat-card-watching"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stat-card-completed"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stat-card-planned"]').exists()).toBe(true);

            // Check quick action buttons exist
            expect(wrapper.find('[data-testid="action-add-anime"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="action-view-lists"]').exists()).toBe(true);
        });

        it("should preserve hardcoded values for non-store data", async () => {
            const wrapper = mount(HomeView, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Completed count should remain hardcoded
            const completedCount = wrapper.find('[data-testid="completed-count"]');
            expect(completedCount.text()).toBe("87");
        });
    });
});
