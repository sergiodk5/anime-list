import HeaderLayout from "@/options/components/HeaderLayout.vue";
import SidebarLayout from "@/options/components/SidebarLayout.vue";
import DashboardLayout from "@/options/layouts/DashboardLayout.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";

// Mock child components
const mockRouter = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: { template: "<div>Home</div>" } },
        { path: "/watch-lists", name: "watch-lists", component: { template: "<div>Watch Lists</div>" } },
    ],
});

describe("DashboardLayout", () => {
    const createWrapper = (slotContent = "<div>Test content</div>") => {
        return mount(DashboardLayout, {
            global: {
                plugins: [mockRouter],
                stubs: {
                    HeaderLayout,
                    SidebarLayout,
                },
            },
            slots: {
                content: slotContent,
            },
        });
    };

    describe("Rendering", () => {
        it("should render the dashboard layout container with correct styling", () => {
            const wrapper = createWrapper();
            const dashboard = wrapper.find('[data-testid="dashboard-layout"]');

            expect(dashboard.exists()).toBe(true);
            expect(dashboard.classes()).toContain("h-screen");
            expect(dashboard.classes()).toContain("bg-gradient-to-br");
            expect(dashboard.classes()).toContain("from-purple-600");
        });

        it("should render animated background pattern", () => {
            const wrapper = createWrapper();
            const background = wrapper.find('[data-testid="dashboard-background"]');

            expect(background.exists()).toBe(true);
            expect(background.classes()).toContain("fixed");
            expect(background.classes()).toContain("inset-0");
            expect(background.classes()).toContain("opacity-10");
        });

        it("should render animated elements in background", () => {
            const wrapper = createWrapper();
            const background = wrapper.find('[data-testid="dashboard-background"]');
            const animatedElements = background.findAll(".animate-pulse, .animate-ping, .animate-bounce");

            expect(animatedElements.length).toBeGreaterThan(0);
        });

        it("should render main content area", () => {
            const wrapper = createWrapper();
            const mainContent = wrapper.find('[data-testid="main-content"]');

            expect(mainContent.exists()).toBe(true);
            expect(mainContent.classes()).toContain("flex-1");
            expect(mainContent.classes()).toContain("overflow-y-auto");
            expect(mainContent.classes()).toContain("p-6");
        });
    });

    describe("Components", () => {
        it("should render HeaderLayout component", () => {
            const wrapper = createWrapper();
            const header = wrapper.findComponent(HeaderLayout);

            expect(header.exists()).toBe(true);
        });

        it("should render SidebarLayout component", () => {
            const wrapper = createWrapper();
            const sidebar = wrapper.findComponent(SidebarLayout);

            expect(sidebar.exists()).toBe(true);
        });
    });

    describe("Slots", () => {
        it("should render slot content in main content area", () => {
            const slotContent = "<div data-testid='slot-content'>Custom content</div>";
            const wrapper = createWrapper(slotContent);

            const slotElement = wrapper.find('[data-testid="slot-content"]');
            expect(slotElement.exists()).toBe(true);
            expect(slotElement.text()).toBe("Custom content");
        });

        it("should handle empty slot gracefully", () => {
            const wrapper = createWrapper("");
            const mainContent = wrapper.find('[data-testid="main-content"]');

            expect(mainContent.exists()).toBe(true);
        });
    });

    describe("Layout Structure", () => {
        it("should have proper flex layout structure", () => {
            const wrapper = createWrapper();
            const dashboard = wrapper.find('[data-testid="dashboard-layout"]');

            expect(dashboard.classes()).toContain("flex");

            const mainArea = dashboard.find(".flex-1.flex-col");
            expect(mainArea.exists()).toBe(true);
        });

        it("should position background behind content", () => {
            const wrapper = createWrapper();
            const background = wrapper.find('[data-testid="dashboard-background"]');

            expect(background.classes()).toContain("fixed");
            expect(background.classes()).toContain("opacity-10");
        });
    });

    describe("Animation Classes", () => {
        it("should have pulse animation elements", () => {
            const wrapper = createWrapper();
            const pulseElements = wrapper.findAll(".animate-pulse");

            expect(pulseElements.length).toBeGreaterThan(0);
        });

        it("should have ping animation elements", () => {
            const wrapper = createWrapper();
            const pingElements = wrapper.findAll(".animate-ping");

            expect(pingElements.length).toBeGreaterThan(0);
        });

        it("should have bounce animation elements", () => {
            const wrapper = createWrapper();
            const bounceElements = wrapper.findAll(".animate-bounce");

            expect(bounceElements.length).toBeGreaterThan(0);
        });

        it("should have delayed animations", () => {
            const wrapper = createWrapper();
            const delayedElements = wrapper.findAll(".delay-700, .delay-1000, .delay-500");

            expect(delayedElements.length).toBeGreaterThan(0);
        });
    });
});
