import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useHiddenStore } from "@/options/stores/hiddenStore";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";
import AllWatchLists from "@/options/views/AllWatchLists.vue";

// Mock the stores
vi.mock("@/options/stores/watchingStore");
vi.mock("@/options/stores/planToWatchStore");
vi.mock("@/options/stores/hiddenStore");

// Mock the useStorageCache composable used by useSmartStats
vi.mock("@/options/composables/useStorageCache", () => ({
    useStorageCache: () => ({
        cachedStats: { value: null },
        updateStatsCache: vi.fn(),
        hasCache: false,
        isStale: true,
    }),
}));

describe("AllWatchLists - Phase 4 Store Integration", () => {
    let pinia: ReturnType<typeof createPinia>;

    const mockWatchingStore = {
        count: ref(3),
        items: ref([{}, {}, {}]), // 3 items to match count
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    const mockPlanToWatchStore = {
        count: ref(7),
        items: ref([{}, {}, {}, {}, {}, {}, {}]), // 7 items to match count
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    const mockHiddenStore = {
        items: ref([{}]), // 1 hidden item
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        // Reset mocks
        vi.clearAllMocks();

        // Reset reactive values
        mockWatchingStore.count.value = 3;
        mockWatchingStore.items.value = [{}, {}, {}]; // 3 items to match count
        mockWatchingStore.isLoading.value = false;
        mockWatchingStore.hasError = false;

        mockPlanToWatchStore.count.value = 7;
        mockPlanToWatchStore.items.value = [{}, {}, {}, {}, {}, {}, {}]; // 7 items to match count
        mockPlanToWatchStore.isLoading.value = false;
        mockPlanToWatchStore.hasError = false;

        mockHiddenStore.items.value = [{}]; // 1 hidden item

        // Mock store implementations
        vi.mocked(useWatchingStore).mockReturnValue(mockWatchingStore as any);
        vi.mocked(usePlanToWatchStore).mockReturnValue(mockPlanToWatchStore as any);
        vi.mocked(useHiddenStore).mockReturnValue(mockHiddenStore as any);
    });

    describe("Store Integration", () => {
        it("should display reactive watching count from store", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toContain("3 series");
        });

        it("should display reactive plan to watch count from store", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toContain("7 series");
        });

        it("should initialize required stores on mount", async () => {
            mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await vi.waitFor(() => {
                expect(mockWatchingStore.init).toHaveBeenCalled();
                expect(mockPlanToWatchStore.init).toHaveBeenCalled();
            });
        });
    });

    describe("Loading States", () => {
        it("should show skeleton loading state when stores are loading", async () => {
            mockPlanToWatchStore.isLoading.value = true;

            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(true);
            const skeletons = wrapper.findAll('[data-testid="skeleton-card"]');
            expect(skeletons.length).toBeGreaterThan(0);
            const mainContent = wrapper.find('[data-testid="watchlists-header"]');
            expect(mainContent.exists()).toBe(false);
        });

        it("should hide loading state when stores finish loading", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(false);

            const mainContent = wrapper.find('[data-testid="watchlists-header"]');
            expect(mainContent.exists()).toBe(true);
        });
    });

    describe("Error States", () => {
        it("should show error state when stores have errors", async () => {
            mockPlanToWatchStore.hasError = true;

            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const errorState = wrapper.find('[data-testid="error-state"]');
            expect(errorState.exists()).toBe(true);
            expect(errorState.text()).toContain("Unable to Load Data");

            const mainContent = wrapper.find('[data-testid="watchlists-header"]');
            expect(mainContent.exists()).toBe(false);
        });
    });

    describe("Reactive Count Updates", () => {
        it("should update watching count when store count changes", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Initial count
            let watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toContain("3 series");

            // Update store count
            mockWatchingStore.count.value = 6;
            mockWatchingStore.items.value = [{}, {}, {}, {}, {}, {}]; // 6 items to match count
            await wrapper.vm.$nextTick();

            // Verify updated count
            watchingCount = wrapper.find('[data-testid="watching-count"]');
            expect(watchingCount.text()).toContain("6 series");
        });

        it("should update plan to watch count when store count changes", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Initial count
            let plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toContain("7 series");

            // Update store count
            mockPlanToWatchStore.count.value = 10;
            mockPlanToWatchStore.items.value = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]; // 10 items to match count
            await wrapper.vm.$nextTick();

            // Verify updated count
            plannedCount = wrapper.find('[data-testid="planned-count"]');
            expect(plannedCount.text()).toContain("10 series");
        });
    });

    describe("Static Content Preservation", () => {
        it("should maintain hardcoded values for non-store managed lists", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // These should remain hardcoded until Phase 6 stats store
            expect(wrapper.find('[data-testid="completed-count"]').text()).toContain("87 series");
            expect(wrapper.find('[data-testid="on-hold-count"]').text()).toContain("5 series");
            expect(wrapper.find('[data-testid="dropped-count"]').text()).toContain("8 series");
        });

        it("should preserve all list cards and UI elements", async () => {
            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            // Check all list cards exist
            expect(wrapper.find('[data-testid="list-currently-watching"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="list-completed"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="list-planned"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="list-on-hold"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="list-dropped"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="list-custom"]').exists()).toBe(true);

            // Check header elements
            expect(wrapper.find('[data-testid="watchlists-header"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="add-list-button"]').exists()).toBe(true);
        });
    });

    describe("Loading Behavior Combinations", () => {
        it("should show loading when either store is loading", async () => {
            mockWatchingStore.isLoading.value = true;
            mockPlanToWatchStore.isLoading.value = false;

            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(true);
        });

        it("should show content when both stores finish loading", async () => {
            mockWatchingStore.isLoading.value = false;
            mockPlanToWatchStore.isLoading.value = false;

            const wrapper = mount(AllWatchLists, {
                global: {
                    plugins: [pinia],
                },
            });

            await wrapper.vm.$nextTick();

            const loadingState = wrapper.find('[data-testid="loading-state"]');
            expect(loadingState.exists()).toBe(false);

            const mainContent = wrapper.find('[data-testid="watchlists-grid"]');
            expect(mainContent.exists()).toBe(true);
        });
    });
});
