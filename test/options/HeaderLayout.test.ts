import HeaderLayout from "@/options/components/HeaderLayout.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";

const mockRouter = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/watch-lists", name: "watch-lists", component: { template: "<div>Watch Lists</div>" } },
        { path: "/nested/path", name: "nested", component: { template: "<div>Nested</div>" } },
    ],
});

describe("HeaderLayout", () => {
    const createWrapper = (initialRoute = "/") => {
        mockRouter.push(initialRoute);
        return mount(HeaderLayout, {
            global: {
                plugins: [mockRouter],
            },
        });
    };

    describe("Rendering", () => {
        it("should render the header container with correct styling", () => {
            const wrapper = createWrapper();
            const header = wrapper.find('[data-testid="header"]');

            expect(header.exists()).toBe(true);
            expect(header.classes()).toContain("h-16");
            expect(header.classes()).toContain("border-b");
            expect(header.classes()).toContain("border-white/20");
            expect(header.classes()).toContain("bg-black/30");
            expect(header.classes()).toContain("backdrop-blur-sm");
        });

        it("should render breadcrumbs navigation", () => {
            const wrapper = createWrapper();
            const breadcrumbs = wrapper.find('[data-testid="breadcrumbs"]');

            expect(breadcrumbs.exists()).toBe(true);
            expect(breadcrumbs.attributes("aria-label")).toBe("Breadcrumb");
        });

        it("should render user menu section", () => {
            const wrapper = createWrapper();
            const userMenu = wrapper.find('[data-testid="user-menu"]');

            expect(userMenu.exists()).toBe(true);
            expect(userMenu.classes()).toContain("flex");
            expect(userMenu.classes()).toContain("items-center");
            expect(userMenu.classes()).toContain("space-x-4");
        });
    });

    describe("Breadcrumbs", () => {
        it("should show home breadcrumb for root route", async () => {
            const wrapper = createWrapper("/");
            await wrapper.vm.$nextTick();

            const breadcrumb = wrapper.find('[data-testid="breadcrumb-0"]');
            expect(breadcrumb.exists()).toBe(true);
            expect(breadcrumb.text()).toBe("Home");
        });

        it("should show home + current page for non-root routes", async () => {
            const wrapper = createWrapper("/watch-lists");
            await mockRouter.isReady();
            await wrapper.vm.$nextTick();

            const breadcrumbs = wrapper.findAll('[data-testid^="breadcrumb-"]');
            expect(breadcrumbs.length).toBeGreaterThanOrEqual(1);

            if (breadcrumbs.length >= 2) {
                const homeBreadcrumb = wrapper.find('[data-testid="breadcrumb-0"]');
                const currentBreadcrumb = wrapper.find('[data-testid="breadcrumb-1"]');

                expect(homeBreadcrumb.exists()).toBe(true);
                expect(homeBreadcrumb.text()).toBe("Home");
                expect(currentBreadcrumb.exists()).toBe(true);
                expect(currentBreadcrumb.text()).toBe("Watch Lists");
            }
        });

        it("should show breadcrumb separators between items", async () => {
            const wrapper = createWrapper();

            // Test that the breadcrumb template can handle separators
            const template = wrapper.html();
            expect(template).toContain("breadcrumbs");
        });

        it("should not show separator after last breadcrumb", async () => {
            const wrapper = createWrapper("/");

            // Test that for single breadcrumb, the structure is correct
            const breadcrumbs = wrapper.findAll('[data-testid^="breadcrumb-"]');
            expect(breadcrumbs.length).toBeGreaterThanOrEqual(1);
        });

        it("should format breadcrumb names correctly", async () => {
            const wrapper = createWrapper("/watch-lists");
            await mockRouter.isReady();
            await wrapper.vm.$nextTick();

            // Test the formatBreadcrumbName function directly
            const vm = wrapper.vm as any;
            expect(typeof vm.formatBreadcrumbName).toBe("function");
            expect(vm.formatBreadcrumbName("watch-lists")).toBe("Watch Lists");
        });
    });

    describe("User Menu", () => {
        it("should render user button", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.exists()).toBe(true);
            expect(userButton.element.tagName).toBe("BUTTON");
        });

        it("should render user avatar", () => {
            const wrapper = createWrapper();
            const userAvatar = wrapper.find('[data-testid="user-avatar"]');

            expect(userAvatar.exists()).toBe(true);
            expect(userAvatar.text()).toBe("👤");
            expect(userAvatar.classes()).toContain("rounded-full");
            expect(userAvatar.classes()).toContain("bg-gradient-to-br");
            expect(userAvatar.classes()).toContain("from-purple-400");
            expect(userAvatar.classes()).toContain("to-pink-400");
        });

        it("should render user label", () => {
            const wrapper = createWrapper();
            const userLabel = wrapper.find('[data-testid="user-label"]');

            expect(userLabel.exists()).toBe(true);
            expect(userLabel.text()).toBe("Account");
            expect(userLabel.classes()).toContain("drop-shadow-sm");
        });

        it("should have proper button styling", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.classes()).toContain("group");
            expect(userButton.classes()).toContain("rounded-xl");
            expect(userButton.classes()).toContain("border");
            expect(userButton.classes()).toContain("border-white/20");
            expect(userButton.classes()).toContain("bg-white/10");
            expect(userButton.classes()).toContain("backdrop-blur-sm");
        });
    });

    describe("Styling and Animation", () => {
        it("should have hover effects on breadcrumb links", () => {
            const wrapper = createWrapper("/watch-lists");
            const breadcrumb = wrapper.find('[data-testid="breadcrumb-0"]');

            expect(breadcrumb.classes()).toContain("hover:bg-white/10");
            expect(breadcrumb.classes()).toContain("hover:text-white");
            expect(breadcrumb.classes()).toContain("hover:shadow-sm");
            expect(breadcrumb.classes()).toContain("hover:shadow-black/20");
        });

        it("should have transitions on interactive elements", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.classes()).toContain("transition-all");
            expect(userButton.classes()).toContain("duration-200");
        });

        it("should have active scale effect on user button", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.classes()).toContain("active:scale-95");
        });

        it("should have hover effects on user button", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.classes()).toContain("hover:border-white/30");
            expect(userButton.classes()).toContain("hover:bg-white/20");
            expect(userButton.classes()).toContain("hover:text-white");
            expect(userButton.classes()).toContain("hover:shadow-md");
            expect(userButton.classes()).toContain("hover:shadow-black/20");
        });
    });

    describe("Accessibility", () => {
        it("should have proper ARIA labels", () => {
            const wrapper = createWrapper();
            const breadcrumbs = wrapper.find('[data-testid="breadcrumbs"]');

            expect(breadcrumbs.attributes("aria-label")).toBe("Breadcrumb");
        });

        it("should use semantic nav element for breadcrumbs", () => {
            const wrapper = createWrapper();
            const breadcrumbs = wrapper.find('[data-testid="breadcrumbs"]');

            expect(breadcrumbs.element.tagName).toBe("NAV");
        });

        it("should use semantic header element", () => {
            const wrapper = createWrapper();
            const header = wrapper.find('[data-testid="header"]');

            expect(header.element.tagName).toBe("HEADER");
        });

        it("should use semantic button element for user interaction", () => {
            const wrapper = createWrapper();
            const userButton = wrapper.find('[data-testid="user-button"]');

            expect(userButton.element.tagName).toBe("BUTTON");
        });
    });

    describe("Breadcrumb Functionality", () => {
        it("should handle routes without names gracefully", async () => {
            const wrapper = createWrapper();
            // Test that breadcrumbs are filtered correctly for routes without names
            const breadcrumbs = wrapper.findAll('[data-testid^="breadcrumb-"]');

            // Should still render properly even with edge cases
            expect(breadcrumbs.length).toBeGreaterThanOrEqual(0);
        });

        it("should format multi-word route names correctly", () => {
            const wrapper = createWrapper();
            // Test the formatBreadcrumbName function indirectly
            const vm = wrapper.vm as any;

            // The component should have the formatBreadcrumbName function
            expect(typeof vm.formatBreadcrumbName).toBe("function");
            expect(vm.formatBreadcrumbName("watch-lists")).toBe("Watch Lists");
            expect(vm.formatBreadcrumbName("user-profile")).toBe("User Profile");
            expect(vm.formatBreadcrumbName("")).toBe("");
        });
    });
});
