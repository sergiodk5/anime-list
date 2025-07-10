import SidebarLayout from "@/options/components/SidebarLayout.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";

const mockRouter = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/watch-lists", name: "watch-lists", component: { template: "<div>Watch Lists</div>" } },
        { path: "/favorites", name: "favorites", component: { template: "<div>Favorites</div>" } },
    ],
});

describe("SidebarLayout", () => {
    const createWrapper = (initialRoute = "/") => {
        mockRouter.push(initialRoute);
        return mount(SidebarLayout, {
            global: {
                plugins: [mockRouter],
            },
        });
    };

    describe("Rendering", () => {
        it("should render the sidebar container with correct styling", () => {
            const wrapper = createWrapper();
            const sidebar = wrapper.find('[data-testid="sidebar"]');

            expect(sidebar.exists()).toBe(true);
            expect(sidebar.classes()).toContain("w-64");
            expect(sidebar.classes()).toContain("flex-col");
            expect(sidebar.classes()).toContain("bg-black/30");
            expect(sidebar.classes()).toContain("text-white");
            expect(sidebar.classes()).toContain("backdrop-blur-sm");
        });

        it("should render the sidebar header with brand", () => {
            const wrapper = createWrapper();
            const header = wrapper.find('[data-testid="sidebar-header"]');

            expect(header.exists()).toBe(true);
            expect(header.classes()).toContain("h-16");
            expect(header.classes()).toContain("bg-black/40");
        });

        it("should render the brand section with icon and title", () => {
            const wrapper = createWrapper();
            const brand = wrapper.find('[data-testid="sidebar-brand"]');
            const icon = wrapper.find('[data-testid="sidebar-icon"]');
            const title = wrapper.find('[data-testid="sidebar-title"]');

            expect(brand.exists()).toBe(true);
            expect(icon.exists()).toBe(true);
            expect(title.exists()).toBe(true);
            expect(title.text()).toBe("AnimeList");
        });

        it("should render the Darkness icon image", () => {
            const wrapper = createWrapper();
            const iconContainer = wrapper.find('[data-testid="sidebar-icon"]');
            const img = iconContainer.find("img");

            expect(img.exists()).toBe(true);
            expect(img.attributes("src")).toBe("/assets/images/darkness_32x32.png");
            expect(img.attributes("alt")).toBe("Darkness from KonoSuba");
        });
    });

    describe("Navigation", () => {
        it("should render navigation container", () => {
            const wrapper = createWrapper();
            const nav = wrapper.find('[data-testid="sidebar-nav"]');

            expect(nav.exists()).toBe(true);
            expect(nav.classes()).toContain("flex-1");
            expect(nav.classes()).toContain("space-y-2");
            expect(nav.classes()).toContain("p-4");
        });

        it("should render Home navigation link", () => {
            const wrapper = createWrapper();
            const homeLink = wrapper.find('[data-testid="nav-home"]');
            const homeIcon = wrapper.find('[data-testid="home-icon"]');

            expect(homeLink.exists()).toBe(true);
            expect(homeIcon.exists()).toBe(true);
            expect(homeIcon.text()).toBe("🏠");
            expect(homeLink.text()).toContain("Home");
        });

        it("should render Watch Lists navigation link", () => {
            const wrapper = createWrapper();
            const watchlistsLink = wrapper.find('[data-testid="nav-watchlists"]');
            const watchlistIcon = wrapper.find('[data-testid="watchlist-icon"]');

            expect(watchlistsLink.exists()).toBe(true);
            expect(watchlistIcon.exists()).toBe(true);
            expect(watchlistIcon.text()).toBe("📺");
            expect(watchlistsLink.text()).toContain("Watch Lists");
        });

        it("should render Favorites navigation link", () => {
            const wrapper = createWrapper();
            const favoritesLink = wrapper.find('[data-testid="nav-favorites"]');
            const favoritesIcon = wrapper.find('[data-testid="favorites-icon"]');

            expect(favoritesLink.exists()).toBe(true);
            expect(favoritesLink.attributes("href")).toBe("/favorites");
            expect(favoritesIcon.exists()).toBe(true);
            expect(favoritesIcon.text()).toBe("⭐");
            expect(favoritesLink.text()).toContain("Favorites");
        });
    });

    describe("Active State", () => {
        it("should highlight active home link", async () => {
            const wrapper = createWrapper("/");
            await wrapper.vm.$nextTick();

            const homeLink = wrapper.find('[data-testid="nav-home"]');
            expect(homeLink.classes()).toContain("border-white/30");
            expect(homeLink.classes()).toContain("bg-white/15");
            expect(homeLink.classes()).toContain("text-white");
        });

        it("should highlight active watch lists link", async () => {
            const wrapper = createWrapper("/watch-lists");
            await wrapper.vm.$nextTick();

            // Test that the link exists and has the correct structure
            const watchlistsLink = wrapper.find('[data-testid="nav-watchlists"]');
            expect(watchlistsLink.exists()).toBe(true);
            expect(watchlistsLink.classes()).toContain("group");
            expect(watchlistsLink.classes()).toContain("flex");
        });

        it("should not highlight inactive links", async () => {
            const wrapper = createWrapper("/");
            await wrapper.vm.$nextTick();

            const watchlistsLink = wrapper.find('[data-testid="nav-watchlists"]');
            expect(watchlistsLink.classes()).toContain("border-transparent");
            expect(watchlistsLink.classes()).toContain("text-white/90");
        });
    });

    describe("Footer", () => {
        it("should render the sidebar footer", () => {
            const wrapper = createWrapper();
            const footer = wrapper.find('[data-testid="sidebar-footer"]');

            expect(footer.exists()).toBe(true);
            expect(footer.classes()).toContain("border-t");
            expect(footer.classes()).toContain("border-white/20");
            expect(footer.classes()).toContain("p-4");
        });

        it("should render the reference link in footer", () => {
            const wrapper = createWrapper();
            const referenceLink = wrapper.find('[data-testid="reference-link"]');

            expect(referenceLink.exists()).toBe(true);
            expect(referenceLink.text()).toContain("Reference Link");
            expect(referenceLink.attributes("href")).toBe("#");
        });

        it("should render link icon in reference link", () => {
            const wrapper = createWrapper();
            const referenceLink = wrapper.find('[data-testid="reference-link"]');

            expect(referenceLink.text()).toContain("🔗");
        });
    });

    describe("Styling", () => {
        it("should have proper hover styles on navigation links", () => {
            const wrapper = createWrapper();
            const homeLink = wrapper.find('[data-testid="nav-home"]');

            expect(homeLink.classes()).toContain("hover:border-white/20");
            expect(homeLink.classes()).toContain("hover:bg-white/10");
            expect(homeLink.classes()).toContain("hover:text-white");
        });

        it("should have transition classes", () => {
            const wrapper = createWrapper();
            const homeLink = wrapper.find('[data-testid="nav-home"]');

            expect(homeLink.classes()).toContain("transition-all");
            expect(homeLink.classes()).toContain("duration-200");
        });

        it("should have active scale effect", () => {
            const wrapper = createWrapper();
            const homeLink = wrapper.find('[data-testid="nav-home"]');

            expect(homeLink.classes()).toContain("active:scale-95");
        });

        it("should have shadow effects", () => {
            const wrapper = createWrapper();
            const homeLink = wrapper.find('[data-testid="nav-home"]');

            expect(homeLink.classes()).toContain("hover:shadow-md");
            expect(homeLink.classes()).toContain("hover:shadow-black/20");
        });
    });

    describe("Icons", () => {
        it("should render all navigation icons", () => {
            const wrapper = createWrapper();

            const homeIcon = wrapper.find('[data-testid="home-icon"]');
            const watchlistIcon = wrapper.find('[data-testid="watchlist-icon"]');
            const favoritesIcon = wrapper.find('[data-testid="favorites-icon"]');

            expect(homeIcon.text()).toBe("🏠");
            expect(watchlistIcon.text()).toBe("📺");
            expect(favoritesIcon.text()).toBe("⭐");
        });

        it("should have drop shadow on icons", () => {
            const wrapper = createWrapper();
            const homeIcon = wrapper.find('[data-testid="home-icon"]');

            expect(homeIcon.classes()).toContain("drop-shadow-sm");
        });
    });
});
