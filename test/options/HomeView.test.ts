import HomeView from "@/options/views/HomeView.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("HomeView", () => {
    const createWrapper = () => {
        return mount(HomeView);
    };

    describe("Rendering", () => {
        it("should render the home view container", () => {
            const wrapper = createWrapper();
            const homeView = wrapper.find('[data-testid="home-view"]');

            expect(homeView.exists()).toBe(true);
            expect(homeView.classes()).toContain("space-y-8");
        });

        it("should render the welcome section", () => {
            const wrapper = createWrapper();
            const welcomeSection = wrapper.find('[data-testid="welcome-section"]');

            expect(welcomeSection.exists()).toBe(true);
            expect(welcomeSection.classes()).toContain("rounded-2xl");
            expect(welcomeSection.classes()).toContain("border");
            expect(welcomeSection.classes()).toContain("border-white/20");
            expect(welcomeSection.classes()).toContain("bg-white/10");
            expect(welcomeSection.classes()).toContain("backdrop-blur-sm");
        });
    });

    describe("Welcome Section", () => {
        it("should render welcome icon", () => {
            const wrapper = createWrapper();
            const welcomeIcon = wrapper.find('[data-testid="welcome-icon"]');

            expect(welcomeIcon.exists()).toBe(true);
            expect(welcomeIcon.text()).toBe("🎌");
            expect(welcomeIcon.classes()).toContain("rounded-xl");
            expect(welcomeIcon.classes()).toContain("bg-white/20");
            expect(welcomeIcon.classes()).toContain("backdrop-blur-sm");
        });

        it("should render welcome title", () => {
            const wrapper = createWrapper();
            const welcomeTitle = wrapper.find('[data-testid="welcome-title"]');

            expect(welcomeTitle.exists()).toBe(true);
            expect(welcomeTitle.text()).toBe("Welcome to AnimeList");
            expect(welcomeTitle.classes()).toContain("text-3xl");
            expect(welcomeTitle.classes()).toContain("font-bold");
            expect(welcomeTitle.classes()).toContain("text-white");
            expect(welcomeTitle.classes()).toContain("drop-shadow-md");
        });

        it("should render welcome subtitle", () => {
            const wrapper = createWrapper();
            const welcomeSubtitle = wrapper.find('[data-testid="welcome-subtitle"]');

            expect(welcomeSubtitle.exists()).toBe(true);
            expect(welcomeSubtitle.text()).toBe("Your ultimate anime tracking companion");
            expect(welcomeSubtitle.classes()).toContain("text-lg");
            expect(welcomeSubtitle.classes()).toContain("text-white/80");
        });

        it("should render welcome description", () => {
            const wrapper = createWrapper();
            const welcomeDescription = wrapper.find('[data-testid="welcome-description"]');

            expect(welcomeDescription.exists()).toBe(true);
            expect(welcomeDescription.text()).toContain("Manage your anime watch lists");
            expect(welcomeDescription.text()).toContain("Built with love for the anime community!");
            expect(welcomeDescription.classes()).toContain("text-white/90");
            expect(welcomeDescription.classes()).toContain("leading-relaxed");
        });
    });

    describe("Stats Section", () => {
        it("should render stats section container", () => {
            const wrapper = createWrapper();
            const statsSection = wrapper.find('[data-testid="stats-section"]');

            expect(statsSection.exists()).toBe(true);
            expect(statsSection.classes()).toContain("grid");
            expect(statsSection.classes()).toContain("grid-cols-1");
            expect(statsSection.classes()).toContain("md:grid-cols-3");
        });

        it("should render currently watching stat card", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="stat-card-watching"]');
            const watchingIcon = wrapper.find('[data-testid="watching-icon"]');
            const watchingTitle = wrapper.find('[data-testid="watching-title"]');
            const watchingCount = wrapper.find('[data-testid="watching-count"]');

            expect(watchingCard.exists()).toBe(true);
            expect(watchingIcon.text()).toBe("▶️");
            expect(watchingTitle.text()).toBe("Currently Watching");
            expect(watchingCount.text()).toBe("12");
            expect(watchingCount.classes()).toContain("text-purple-200");
        });

        it("should render completed stat card", () => {
            const wrapper = createWrapper();
            const completedCard = wrapper.find('[data-testid="stat-card-completed"]');
            const completedIcon = wrapper.find('[data-testid="completed-icon"]');
            const completedTitle = wrapper.find('[data-testid="completed-title"]');
            const completedCount = wrapper.find('[data-testid="completed-count"]');

            expect(completedCard.exists()).toBe(true);
            expect(completedIcon.text()).toBe("✅");
            expect(completedTitle.text()).toBe("Completed");
            expect(completedCount.text()).toBe("87");
            expect(completedCount.classes()).toContain("text-green-200");
        });

        it("should render plan to watch stat card", () => {
            const wrapper = createWrapper();
            const plannedCard = wrapper.find('[data-testid="stat-card-planned"]');
            const plannedIcon = wrapper.find('[data-testid="planned-icon"]');
            const plannedTitle = wrapper.find('[data-testid="planned-title"]');
            const plannedCount = wrapper.find('[data-testid="planned-count"]');

            expect(plannedCard.exists()).toBe(true);
            expect(plannedIcon.text()).toBe("📋");
            expect(plannedTitle.text()).toBe("Plan to Watch");
            expect(plannedCount.text()).toBe("34");
            expect(plannedCount.classes()).toContain("text-blue-200");
        });

        it("should have hover effects on stat cards", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="stat-card-watching"]');

            expect(watchingCard.classes()).toContain("group");
            expect(watchingCard.classes()).toContain("hover:border-white/30");
            expect(watchingCard.classes()).toContain("hover:bg-white/15");
            expect(watchingCard.classes()).toContain("hover:shadow-lg");
            expect(watchingCard.classes()).toContain("hover:shadow-black/20");
        });
    });

    describe("Actions Section", () => {
        it("should render actions section", () => {
            const wrapper = createWrapper();
            const actionsSection = wrapper.find('[data-testid="actions-section"]');
            const actionsTitle = wrapper.find('[data-testid="actions-title"]');

            expect(actionsSection.exists()).toBe(true);
            expect(actionsTitle.exists()).toBe(true);
            expect(actionsTitle.text()).toBe("Quick Actions");
            expect(actionsTitle.classes()).toContain("text-2xl");
            expect(actionsTitle.classes()).toContain("font-bold");
        });

        it("should render add anime action button", () => {
            const wrapper = createWrapper();
            const addAnimeButton = wrapper.find('[data-testid="action-add-anime"]');
            const addAnimeIcon = wrapper.find('[data-testid="add-anime-icon"]');

            expect(addAnimeButton.exists()).toBe(true);
            expect(addAnimeIcon.text()).toBe("➕");
            expect(addAnimeButton.text()).toContain("Add New Anime");
            expect(addAnimeButton.text()).toContain("Add a new series to your list");
        });

        it("should render view lists action button", () => {
            const wrapper = createWrapper();
            const viewListsButton = wrapper.find('[data-testid="action-view-lists"]');
            const viewListsIcon = wrapper.find('[data-testid="view-lists-icon"]');

            expect(viewListsButton.exists()).toBe(true);
            expect(viewListsIcon.text()).toBe("📖");
            expect(viewListsButton.text()).toContain("View All Lists");
            expect(viewListsButton.text()).toContain("Browse your watch lists");
        });

        it("should have proper button styling for action buttons", () => {
            const wrapper = createWrapper();
            const addAnimeButton = wrapper.find('[data-testid="action-add-anime"]');

            expect(addAnimeButton.classes()).toContain("group");
            expect(addAnimeButton.classes()).toContain("rounded-xl");
            expect(addAnimeButton.classes()).toContain("border");
            expect(addAnimeButton.classes()).toContain("border-white/20");
            expect(addAnimeButton.classes()).toContain("bg-white/10");
            expect(addAnimeButton.classes()).toContain("active:scale-95");
        });

        it("should have hover effects on action buttons", () => {
            const wrapper = createWrapper();
            const addAnimeButton = wrapper.find('[data-testid="action-add-anime"]');

            expect(addAnimeButton.classes()).toContain("hover:border-white/30");
            expect(addAnimeButton.classes()).toContain("hover:bg-white/15");
            expect(addAnimeButton.classes()).toContain("hover:shadow-lg");
            expect(addAnimeButton.classes()).toContain("hover:shadow-black/20");
        });
    });

    describe("Styling and Layout", () => {
        it("should have consistent card styling across sections", () => {
            const wrapper = createWrapper();
            const welcomeSection = wrapper.find('[data-testid="welcome-section"]');
            const actionsSection = wrapper.find('[data-testid="actions-section"]');

            // Both should have similar styling
            expect(welcomeSection.classes()).toContain("rounded-2xl");
            expect(welcomeSection.classes()).toContain("border");
            expect(welcomeSection.classes()).toContain("border-white/20");
            expect(welcomeSection.classes()).toContain("bg-white/10");
            expect(welcomeSection.classes()).toContain("backdrop-blur-sm");

            expect(actionsSection.classes()).toContain("rounded-2xl");
            expect(actionsSection.classes()).toContain("border");
            expect(actionsSection.classes()).toContain("border-white/20");
            expect(actionsSection.classes()).toContain("bg-white/10");
            expect(actionsSection.classes()).toContain("backdrop-blur-sm");
        });

        it("should have responsive grid layouts", () => {
            const wrapper = createWrapper();
            const statsSection = wrapper.find('[data-testid="stats-section"]');

            expect(statsSection.classes()).toContain("grid-cols-1");
            expect(statsSection.classes()).toContain("md:grid-cols-3");
        });

        it("should have drop shadow effects on text", () => {
            const wrapper = createWrapper();
            const welcomeTitle = wrapper.find('[data-testid="welcome-title"]');
            const welcomeIcon = wrapper.find('[data-testid="welcome-icon"]');

            expect(welcomeTitle.classes()).toContain("drop-shadow-md");
            expect(welcomeIcon.classes()).toContain("backdrop-blur-sm");
        });

        it("should have transition effects", () => {
            const wrapper = createWrapper();
            const watchingCard = wrapper.find('[data-testid="stat-card-watching"]');

            expect(watchingCard.classes()).toContain("transition-all");
            expect(watchingCard.classes()).toContain("duration-300");
        });
    });

    describe("Accessibility", () => {
        it("should use semantic button elements for interactive actions", () => {
            const wrapper = createWrapper();
            const addAnimeButton = wrapper.find('[data-testid="action-add-anime"]');
            const viewListsButton = wrapper.find('[data-testid="action-view-lists"]');

            expect(addAnimeButton.element.tagName).toBe("BUTTON");
            expect(viewListsButton.element.tagName).toBe("BUTTON");
        });

        it("should have proper heading hierarchy", () => {
            const wrapper = createWrapper();
            const welcomeTitle = wrapper.find('[data-testid="welcome-title"]');
            const actionsTitle = wrapper.find('[data-testid="actions-title"]');

            expect(welcomeTitle.element.tagName).toBe("H1");
            expect(actionsTitle.element.tagName).toBe("H2");
        });
    });
});
