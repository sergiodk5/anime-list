import OptionsPage from "@/options/OptionsPage.vue";
import DashboardLayout from "@/options/layouts/DashboardLayout.vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";

const mockRouter = createRouter({
    history: createWebHistory(),
    routes: [{ path: "/", name: "home", component: { template: "<div>Home</div>" } }],
});

describe("OptionsPage", () => {
    const createWrapper = () => {
        return mount(OptionsPage, {
            global: {
                plugins: [mockRouter],
                stubs: {
                    DashboardLayout: {
                        template: '<div data-testid="dashboard-layout"><slot name="content"></slot></div>',
                    },
                    RouterView: {
                        template: '<div data-testid="router-view">Router View Content</div>',
                    },
                },
            },
        });
    };

    describe("Rendering", () => {
        it("should render the options page with DashboardLayout", () => {
            const wrapper = createWrapper();
            const dashboardLayout = wrapper.findComponent(DashboardLayout);

            expect(dashboardLayout.exists()).toBe(true);
        });

        it("should render RouterView in the content slot", () => {
            const wrapper = createWrapper();
            const routerView = wrapper.find('[data-testid="router-view"]');

            expect(routerView.exists()).toBe(true);
            expect(routerView.text()).toBe("Router View Content");
        });

        it("should pass content to DashboardLayout slot", () => {
            const wrapper = createWrapper();
            const dashboardLayout = wrapper.find('[data-testid="dashboard-layout"]');
            const routerView = wrapper.find('[data-testid="router-view"]');

            expect(dashboardLayout.exists()).toBe(true);
            expect(routerView.exists()).toBe(true);
            expect(dashboardLayout.element.contains(routerView.element)).toBe(true);
        });
    });

    describe("Component Structure", () => {
        it("should import and use DashboardLayout component", () => {
            const wrapper = createWrapper();
            const dashboardLayout = wrapper.findComponent(DashboardLayout);

            expect(dashboardLayout.exists()).toBe(true);
        });

        it("should have the correct component hierarchy", () => {
            const wrapper = createWrapper();

            // Should contain DashboardLayout at the root
            expect(wrapper.findComponent(DashboardLayout).exists()).toBe(true);

            // Should contain RouterView inside the layout
            expect(wrapper.find('[data-testid="router-view"]').exists()).toBe(true);
        });
    });

    describe("Slots", () => {
        it("should use the content slot of DashboardLayout", () => {
            const wrapper = createWrapper();

            // The RouterView should be rendered within the dashboard layout
            const dashboardLayout = wrapper.find('[data-testid="dashboard-layout"]');
            expect(dashboardLayout.exists()).toBe(true);

            // And it should contain the router view
            const routerView = wrapper.find('[data-testid="router-view"]');
            expect(routerView.exists()).toBe(true);
        });
    });
});
