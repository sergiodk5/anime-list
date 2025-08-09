import AllWatchLists from "@/options/views/AllWatchLists.vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

// Mock the stores
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";

vi.mock("@/options/stores/watchingStore");
vi.mock("@/options/stores/planToWatchStore");

describe("AllWatchLists", () => {
    let pinia: ReturnType<typeof createPinia>;

    const mockWatchingStore = {
        count: ref(3),
        isLoading: ref(false),
        hasError: false,
        init: vi.fn().mockResolvedValue(undefined),
    };

    const mockPlanToWatchStore = {
        count: ref(7),
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
        mockWatchingStore.isLoading.value = false;
        mockWatchingStore.hasError = false;

        mockPlanToWatchStore.count.value = 7;
        mockPlanToWatchStore.isLoading.value = false;
        mockPlanToWatchStore.hasError = false;

        // Mock store implementations
        vi.mocked(useWatchingStore).mockReturnValue(mockWatchingStore as any);
        vi.mocked(usePlanToWatchStore).mockReturnValue(mockPlanToWatchStore as any);
    });

    const createWrapper = () => {
        return mount(AllWatchLists, {
            global: {
                plugins: [pinia],
            },
        });
    };

    describe("Rendering", () => {
        it("should render the watchlists view container", () => {
            const wrapper = createWrapper();
            const watchlistsView = wrapper.find('[data-testid="watchlists-view"]');

            expect(watchlistsView.exists()).toBe(true);
            expect(watchlistsView.classes()).toContain("space-y-8");
        });

        it("should render the page header", () => {
            const wrapper = createWrapper();
            const header = wrapper.find('[data-testid="watchlists-header"]');

            expect(header.exists()).toBe(true);
            expect(header.classes()).toContain("flex");
            expect(header.classes()).toContain("items-center");
            expect(header.classes()).toContain("justify-between");
        });
    });

    describe("Page Header", () => {
        it("should render page icon", () => {
            const wrapper = createWrapper();
            const pageIcon = wrapper.find('[data-testid="page-icon"]');

            expect(pageIcon.exists()).toBe(true);
            expect(pageIcon.text()).toBe("📺");
            expect(pageIcon.classes()).toContain("rounded-xl");
            expect(pageIcon.classes()).toContain("bg-white/20");
            expect(pageIcon.classes()).toContain("backdrop-blur-xs");
        });

        it("should render page title", () => {
            const wrapper = createWrapper();
            const pageTitle = wrapper.find('[data-testid="page-title"]');

            expect(pageTitle.exists()).toBe(true);
            expect(pageTitle.text()).toBe("Watch Lists");
            expect(pageTitle.classes()).toContain("text-3xl");
            expect(pageTitle.classes()).toContain("font-bold");
            expect(pageTitle.classes()).toContain("text-white");
            expect(pageTitle.classes()).toContain("drop-shadow-md");
        });

        it("should render page subtitle", () => {
            const wrapper = createWrapper();
            const pageSubtitle = wrapper.find('[data-testid="page-subtitle"]');

            expect(pageSubtitle.exists()).toBe(true);
            expect(pageSubtitle.text()).toBe("Manage your anime collections");
            expect(pageSubtitle.classes()).toContain("text-lg");
            expect(pageSubtitle.classes()).toContain("text-white/80");
        });

        it("should render add list button", () => {
            const wrapper = createWrapper();
            const addListButton = wrapper.find('[data-testid="add-list-button"]');
            const addIcon = wrapper.find('[data-testid="add-icon"]');

            expect(addListButton.exists()).toBe(true);
            expect(addIcon.text()).toBe("➕");
            expect(addListButton.text()).toContain("New List");
            expect(addListButton.element.tagName).toBe("BUTTON");
        });
    });

    describe("Watch Lists Grid", () => {
        it("should render watchlists grid container", () => {
            const wrapper = createWrapper();
            const grid = wrapper.find('[data-testid="watchlists-grid"]');

            expect(grid.exists()).toBe(true);
            expect(grid.classes()).toContain("grid");
            expect(grid.classes()).toContain("grid-cols-1");
            expect(grid.classes()).toContain("md:grid-cols-2");
            expect(grid.classes()).toContain("lg:grid-cols-3");
        });

        it("should render currently watching list card", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="list-currently-watching"]');
            const watchingIcon = wrapper.find('[data-testid="watching-icon"]');
            const watchingTitle = wrapper.find('[data-testid="watching-title"]');
            const watchingDescription = wrapper.find('[data-testid="watching-description"]');
            const watchingCount = wrapper.find('[data-testid="watching-count"]');
            const viewButton = wrapper.find('[data-testid="view-watching"]');

            expect(watchingCard.exists()).toBe(true);
            expect(watchingIcon.text()).toBe("▶️");
            expect(watchingTitle.text()).toBe("Currently Watching");
            expect(watchingDescription.text()).toBe("Anime you're actively following");
            expect(watchingCount.text()).toBe("3 series");
            expect(watchingCount.classes()).toContain("text-purple-200");
            expect(viewButton.text()).toBe("View →");
        });

        it("should render completed list card", () => {
            const wrapper = createWrapper();
            const completedCard = wrapper.find('[data-testid="list-completed"]');
            const completedIcon = wrapper.find('[data-testid="completed-icon"]');
            const completedTitle = wrapper.find('[data-testid="completed-title"]');
            const completedDescription = wrapper.find('[data-testid="completed-description"]');
            const completedCount = wrapper.find('[data-testid="completed-count"]');
            const viewButton = wrapper.find('[data-testid="view-completed"]');

            expect(completedCard.exists()).toBe(true);
            expect(completedIcon.text()).toBe("✅");
            expect(completedTitle.text()).toBe("Completed");
            expect(completedDescription.text()).toBe("Anime you've finished watching");
            expect(completedCount.text()).toBe("87 series");
            expect(completedCount.classes()).toContain("text-green-200");
            expect(viewButton.text()).toBe("View →");
        });

        it("should render plan to watch list card", () => {
            const wrapper = createWrapper();
            const plannedCard = wrapper.find('[data-testid="list-planned"]');
            const plannedIcon = wrapper.find('[data-testid="planned-icon"]');
            const plannedTitle = wrapper.find('[data-testid="planned-title"]');
            const plannedDescription = wrapper.find('[data-testid="planned-description"]');
            const plannedCount = wrapper.find('[data-testid="planned-count"]');
            const viewButton = wrapper.find('[data-testid="view-planned"]');

            expect(plannedCard.exists()).toBe(true);
            expect(plannedIcon.text()).toBe("📋");
            expect(plannedTitle.text()).toBe("Plan to Watch");
            expect(plannedDescription.text()).toBe("Anime on your watchlist");
            expect(plannedCount.text()).toBe("7 series");
            expect(plannedCount.classes()).toContain("text-blue-200");
            expect(viewButton.text()).toBe("View →");
        });

        it("should render on hold list card", () => {
            const wrapper = createWrapper();
            const onHoldCard = wrapper.find('[data-testid="list-on-hold"]');
            const onHoldIcon = wrapper.find('[data-testid="on-hold-icon"]');
            const onHoldTitle = wrapper.find('[data-testid="on-hold-title"]');
            const onHoldDescription = wrapper.find('[data-testid="on-hold-description"]');
            const onHoldCount = wrapper.find('[data-testid="on-hold-count"]');
            const viewButton = wrapper.find('[data-testid="view-on-hold"]');

            expect(onHoldCard.exists()).toBe(true);
            expect(onHoldIcon.text()).toBe("⏸️");
            expect(onHoldTitle.text()).toBe("On Hold");
            expect(onHoldDescription.text()).toBe("Anime you've paused watching");
            expect(onHoldCount.text()).toBe("5 series");
            expect(onHoldCount.classes()).toContain("text-yellow-200");
            expect(viewButton.text()).toBe("View →");
        });

        it("should render dropped list card", () => {
            const wrapper = createWrapper();
            const droppedCard = wrapper.find('[data-testid="list-dropped"]');
            const droppedIcon = wrapper.find('[data-testid="dropped-icon"]');
            const droppedTitle = wrapper.find('[data-testid="dropped-title"]');
            const droppedDescription = wrapper.find('[data-testid="dropped-description"]');
            const droppedCount = wrapper.find('[data-testid="dropped-count"]');
            const viewButton = wrapper.find('[data-testid="view-dropped"]');

            expect(droppedCard.exists()).toBe(true);
            expect(droppedIcon.text()).toBe("❌");
            expect(droppedTitle.text()).toBe("Dropped");
            expect(droppedDescription.text()).toBe("Anime you've stopped watching");
            expect(droppedCount.text()).toBe("8 series");
            expect(droppedCount.classes()).toContain("text-red-200");
            expect(viewButton.text()).toBe("View →");
        });

        it("should render custom list placeholder card", () => {
            const wrapper = createWrapper();
            const customCard = wrapper.find('[data-testid="list-custom"]');
            const customIcon = wrapper.find('[data-testid="custom-icon"]');
            const customTitle = wrapper.find('[data-testid="custom-title"]');
            const customDescription = wrapper.find('[data-testid="custom-description"]');

            expect(customCard.exists()).toBe(true);
            expect(customIcon.text()).toBe("➕");
            expect(customTitle.text()).toBe("Create Custom List");
            expect(customDescription.text()).toBe("Add your own categories");
            expect(customCard.classes()).toContain("border-dashed");
            expect(customCard.classes()).toContain("border-white/30");
            expect(customCard.classes()).toContain("bg-white/5");
        });
    });

    describe("Card Styling", () => {
        it("should have consistent card styling for list cards", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="list-currently-watching"]');

            expect(watchingCard.classes()).toContain("group");
            expect(watchingCard.classes()).toContain("rounded-2xl");
            expect(watchingCard.classes()).toContain("border");
            expect(watchingCard.classes()).toContain("border-white/20");
            expect(watchingCard.classes()).toContain("bg-white/10");
            expect(watchingCard.classes()).toContain("backdrop-blur-xs");
        });

        it("should have hover effects on list cards", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="list-currently-watching"]');

            expect(watchingCard.classes()).toContain("hover:border-white/30");
            expect(watchingCard.classes()).toContain("hover:bg-white/15");
            expect(watchingCard.classes()).toContain("hover:shadow-lg");
            expect(watchingCard.classes()).toContain("hover:shadow-black/20");
        });

        it("should have transition effects", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="list-currently-watching"]');

            expect(watchingCard.classes()).toContain("transition-all");
            expect(watchingCard.classes()).toContain("duration-300");
        });

        it("should have different styling for custom list placeholder", () => {
            const wrapper = createWrapper();
            const customCard = wrapper.find('[data-testid="list-custom"]');

            expect(customCard.classes()).toContain("border-dashed");
            expect(customCard.classes()).toContain("bg-white/5");
            expect(customCard.classes()).toContain("hover:border-white/40");
            expect(customCard.classes()).toContain("hover:bg-white/10");
        });
    });

    describe("Button Styling", () => {
        it("should have proper styling for add list button", () => {
            const wrapper = createWrapper();
            const addListButton = wrapper.find('[data-testid="add-list-button"]');

            expect(addListButton.classes()).toContain("group");
            expect(addListButton.classes()).toContain("rounded-xl");
            expect(addListButton.classes()).toContain("border");
            expect(addListButton.classes()).toContain("border-white/20");
            expect(addListButton.classes()).toContain("bg-white/10");
            expect(addListButton.classes()).toContain("backdrop-blur-xs");
            expect(addListButton.classes()).toContain("active:scale-95");
        });

        it("should have proper styling for view buttons", () => {
            const wrapper = createWrapper();
            const viewButton = wrapper.find('[data-testid="view-watching"]');

            expect(viewButton.classes()).toContain("rounded-lg");
            expect(viewButton.classes()).toContain("border");
            expect(viewButton.classes()).toContain("border-white/20");
            expect(viewButton.classes()).toContain("bg-white/10");
            expect(viewButton.classes()).toContain("hover:bg-white/20");
        });
    });

    describe("Color Consistency", () => {
        it("should use consistent colors for different list types", () => {
            const wrapper = createWrapper();

            const watchingCount = wrapper.find('[data-testid="watching-count"]');
            const completedCount = wrapper.find('[data-testid="completed-count"]');
            const plannedCount = wrapper.find('[data-testid="planned-count"]');
            const onHoldCount = wrapper.find('[data-testid="on-hold-count"]');
            const droppedCount = wrapper.find('[data-testid="dropped-count"]');

            expect(watchingCount.classes()).toContain("text-purple-200");
            expect(completedCount.classes()).toContain("text-green-200");
            expect(plannedCount.classes()).toContain("text-blue-200");
            expect(onHoldCount.classes()).toContain("text-yellow-200");
            expect(droppedCount.classes()).toContain("text-red-200");
        });

        it("should have drop shadow-sm effects on text elements", () => {
            const wrapper = createWrapper();
            const pageTitle = wrapper.find('[data-testid="page-title"]');
            const watchingTitle = wrapper.find('[data-testid="watching-title"]');

            expect(pageTitle.classes()).toContain("drop-shadow-md");
            expect(watchingTitle.classes()).toContain("drop-shadow-xs");
        });
    });

    describe("Accessibility", () => {
        it("should use semantic button elements", () => {
            const wrapper = createWrapper();
            const addListButton = wrapper.find('[data-testid="add-list-button"]');
            const viewButton = wrapper.find('[data-testid="view-watching"]');

            expect(addListButton.element.tagName).toBe("BUTTON");
            expect(viewButton.element.tagName).toBe("BUTTON");
        });

        it("should have proper heading hierarchy", () => {
            const wrapper = createWrapper();
            const pageTitle = wrapper.find('[data-testid="page-title"]');
            const watchingTitle = wrapper.find('[data-testid="watching-title"]');

            expect(pageTitle.element.tagName).toBe("H1");
            expect(watchingTitle.element.tagName).toBe("H3");
        });

        it("should have centered content in custom list placeholder", () => {
            const wrapper = createWrapper();
            const customCard = wrapper.find('[data-testid="list-custom"]');
            const innerDiv = customCard.find(".flex.h-full.flex-col");

            expect(innerDiv.exists()).toBe(true);
            expect(innerDiv.classes()).toContain("items-center");
            expect(innerDiv.classes()).toContain("justify-center");
            expect(innerDiv.classes()).toContain("text-center");
        });
    });

    describe("Statistics Display", () => {
        it("should display correct count formatting", () => {
            const wrapper = createWrapper();

            const counts = [
                { testid: "watching-count", expected: "3 series" },
                { testid: "completed-count", expected: "87 series" },
                { testid: "planned-count", expected: "7 series" },
                { testid: "on-hold-count", expected: "5 series" },
                { testid: "dropped-count", expected: "8 series" },
            ];

            counts.forEach(({ testid, expected }) => {
                const countElement = wrapper.find(`[data-testid="${testid}"]`);
                expect(countElement.text()).toBe(expected);
                expect(countElement.classes()).toContain("text-2xl");
                expect(countElement.classes()).toContain("font-bold");
                expect(countElement.classes()).toContain("drop-shadow-xs");
            });
        });
    });
});
