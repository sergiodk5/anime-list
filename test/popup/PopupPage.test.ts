import PopupPage from "@/popup/PopupPage.vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Chrome APIs
const mockOpenOptionsPage = vi.fn();
global.chrome = {
    runtime: {
        openOptionsPage: mockOpenOptionsPage,
    },
} as any;

describe("PopupPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Component Rendering", () => {
        it("should render the popup component", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.exists()).toBe(true);
        });

        it("should have the correct main container", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="anime-popup"]').exists()).toBe(true);
        });

        it("should render the background gradient", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="popup-background"]').exists()).toBe(true);
        });

        it("should render the main content container", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="popup-content"]').exists()).toBe(true);
        });
    });

    describe("Header Section", () => {
        it("should render the popup header", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="popup-header"]').exists()).toBe(true);
        });

        it("should render the anime icon", () => {
            const wrapper = mount(PopupPage);
            const iconContainer = wrapper.find('[data-testid="anime-icon"]');
            expect(iconContainer.exists()).toBe(true);

            const img = iconContainer.find("img");
            expect(img.exists()).toBe(true);
            expect(img.attributes("src")).toBe("/assets/images/darkness_32x32.png");
            expect(img.attributes("alt")).toBe("Darkness from KonoSuba");
        });

        it("should render the correct title", () => {
            const wrapper = mount(PopupPage);
            const title = wrapper.find('[data-testid="popup-title"]');
            expect(title.exists()).toBe(true);
            expect(title.text()).toBe("AnimeList");
        });

        it("should render the Darkness icon with correct attributes", () => {
            const wrapper = mount(PopupPage);
            const img = wrapper.find('[data-testid="anime-icon"] img');

            expect(img.exists()).toBe(true);
            expect(img.attributes("src")).toBe("/assets/images/darkness_32x32.png");
            expect(img.attributes("alt")).toBe("Darkness from KonoSuba");
            expect(img.classes()).toContain("h-6");
            expect(img.classes()).toContain("w-6");
            expect(img.classes()).toContain("rounded");
        });
    });

    describe("Description Section", () => {
        it("should render the description text", () => {
            const wrapper = mount(PopupPage);
            const description = wrapper.find('[data-testid="popup-description"]');
            expect(description.exists()).toBe(true);
            expect(description.text()).toBe("Manage your anime watch list and track your progress");
        });
    });

    describe("Options Button", () => {
        it("should render the options button", () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');
            expect(button.exists()).toBe(true);
        });

        it("should render button with correct text and icon", () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            const icon = button.find('[data-testid="button-icon"]');
            const text = button.find('[data-testid="button-text"]');

            expect(icon.exists()).toBe(true);
            expect(icon.text()).toBe("⚙️");
            expect(text.exists()).toBe(true);
            expect(text.text()).toBe("Open Dashboard");
        });

        it("should render the button shine effect element", () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');
            const shine = button.find('[data-testid="button-shine"]');
            expect(shine.exists()).toBe(true);
        });

        it("should call chrome.runtime.openOptionsPage when clicked", async () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            await button.trigger("click");

            expect(mockOpenOptionsPage).toHaveBeenCalledTimes(1);
        });

        it("should handle multiple clicks correctly", async () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            await button.trigger("click");
            await button.trigger("click");
            await button.trigger("click");

            expect(mockOpenOptionsPage).toHaveBeenCalledTimes(3);
        });
    });

    describe("Footer Section", () => {
        it("should render the popup footer", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="popup-footer"]').exists()).toBe(true);
        });

        it("should render decorative dots container", () => {
            const wrapper = mount(PopupPage);
            expect(wrapper.find('[data-testid="decorative-dots"]').exists()).toBe(true);
        });

        it("should render exactly three decorative dots", () => {
            const wrapper = mount(PopupPage);
            const dots = wrapper.findAll('[data-testid="dot"]');
            expect(dots).toHaveLength(3);
        });

        it("should render all dots as span elements", () => {
            const wrapper = mount(PopupPage);
            const dots = wrapper.findAll('[data-testid="dot"]');

            dots.forEach((dot) => {
                expect(dot.element.tagName).toBe("SPAN");
            });
        });
    });

    describe("Component Structure", () => {
        it("should have the correct overall structure", () => {
            const wrapper = mount(PopupPage);

            // Check main container
            const mainContainer = wrapper.find('[data-testid="anime-popup"]');
            expect(mainContainer.exists()).toBe(true);

            // Check background
            const background = mainContainer.find('[data-testid="popup-background"]');
            expect(background.exists()).toBe(true);

            // Check content container
            const content = mainContainer.find('[data-testid="popup-content"]');
            expect(content.exists()).toBe(true);

            // Check all main sections exist within content
            expect(content.find('[data-testid="popup-header"]').exists()).toBe(true);
            expect(content.find('[data-testid="popup-description"]').exists()).toBe(true);
            expect(content.find('[data-testid="options-button"]').exists()).toBe(true);
            expect(content.find('[data-testid="popup-footer"]').exists()).toBe(true);
        });

        it("should have proper nesting of elements", () => {
            const wrapper = mount(PopupPage);

            // Header should contain icon and title
            const header = wrapper.find('[data-testid="popup-header"]');
            expect(header.find('[data-testid="anime-icon"]').exists()).toBe(true);
            expect(header.find('[data-testid="popup-title"]').exists()).toBe(true);

            // Button should contain icon, text, and shine
            const button = wrapper.find('[data-testid="options-button"]');
            expect(button.find('[data-testid="button-icon"]').exists()).toBe(true);
            expect(button.find('[data-testid="button-text"]').exists()).toBe(true);
            expect(button.find('[data-testid="button-shine"]').exists()).toBe(true);

            // Footer should contain dots container
            const footer = wrapper.find('[data-testid="popup-footer"]');
            expect(footer.find('[data-testid="decorative-dots"]').exists()).toBe(true);
        });
    });

    describe("Component Props and Setup", () => {
        it("should not accept any props", () => {
            const wrapper = mount(PopupPage);
            expect(Object.keys(wrapper.props())).toHaveLength(0);
        });

        it("should mount without errors", () => {
            expect(() => mount(PopupPage)).not.toThrow();
        });
    });

    describe("Event Handling", () => {
        it("should handle button click events properly", async () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            // Simulate click event
            const clickEvent = new Event("click");
            await button.element.dispatchEvent(clickEvent);

            // The Chrome API mock should be called
            expect(mockOpenOptionsPage).toHaveBeenCalled();
        });

        it("should handle keyboard events on button", async () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            // Simulate Enter key press
            await button.trigger("keydown.enter");
            // Note: Vue doesn't automatically trigger click on Enter for buttons,
            // but the button is still accessible
            expect(button.element.tagName).toBe("BUTTON");
        });
    });

    describe("Accessibility", () => {
        it("should render button as actual button element", () => {
            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');
            expect(button.element.tagName).toBe("BUTTON");
        });

        it("should have proper heading structure", () => {
            const wrapper = mount(PopupPage);
            const title = wrapper.find('[data-testid="popup-title"]');
            expect(title.element.tagName).toBe("H1");
        });

        it("should have descriptive text for screen readers", () => {
            const wrapper = mount(PopupPage);
            const description = wrapper.find('[data-testid="popup-description"]');
            expect(description.text()).toContain("Manage your anime watch list");
        });
    });

    describe("Chrome API Integration", () => {
        it("should handle Chrome API errors gracefully", async () => {
            // Mock Chrome API to throw an error
            mockOpenOptionsPage.mockImplementationOnce(() => {
                throw new Error("Chrome API error");
            });

            // Mock console.error to verify it's called
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            // Should not throw error even if Chrome API fails
            await button.trigger("click");

            expect(mockOpenOptionsPage).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalledWith("Failed to open options page:", expect.any(Error));

            consoleSpy.mockRestore();
        });

        it("should work when Chrome API is undefined", async () => {
            // Temporarily remove Chrome API
            const originalChrome = global.chrome;
            delete (global as any).chrome;

            // Mock console.warn to verify it's called
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            // Should not throw error even if Chrome is undefined
            await button.trigger("click");

            expect(consoleSpy).toHaveBeenCalledWith("Chrome extension API not available");

            // Restore Chrome API
            global.chrome = originalChrome;
            consoleSpy.mockRestore();
        });

        it("should work when Chrome runtime is undefined", async () => {
            // Mock Chrome without runtime
            global.chrome = {} as any;

            // Mock console.warn to verify it's called
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            await button.trigger("click");

            expect(consoleSpy).toHaveBeenCalledWith("Chrome extension API not available");

            // Restore Chrome API
            global.chrome = {
                runtime: {
                    openOptionsPage: mockOpenOptionsPage,
                },
            } as any;
            consoleSpy.mockRestore();
        });

        it("should work when openOptionsPage is undefined", async () => {
            // Mock Chrome with runtime but no openOptionsPage
            global.chrome = {
                runtime: {},
            } as any;

            // Mock console.warn to verify it's called
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const wrapper = mount(PopupPage);
            const button = wrapper.find('[data-testid="options-button"]');

            await button.trigger("click");

            expect(consoleSpy).toHaveBeenCalledWith("Chrome extension API not available");

            // Restore Chrome API
            global.chrome = {
                runtime: {
                    openOptionsPage: mockOpenOptionsPage,
                },
            } as any;
            consoleSpy.mockRestore();
        });
    });

    describe("Component Lifecycle", () => {
        it("should initialize without async operations", () => {
            // Since the component doesn't have onMounted hooks or async setup,
            // it should initialize synchronously
            const wrapper = mount(PopupPage);
            expect(wrapper.vm).toBeDefined();
        });

        it("should unmount cleanly", () => {
            const wrapper = mount(PopupPage);
            expect(() => wrapper.unmount()).not.toThrow();
        });
    });

    describe("Data Test IDs", () => {
        it("should have all required data-testid attributes", () => {
            const wrapper = mount(PopupPage);

            // Check all required data-testid elements exist
            const expectedTestIds = [
                "anime-popup",
                "popup-background",
                "popup-content",
                "popup-header",
                "anime-icon",
                "popup-title",
                "popup-description",
                "options-button",
                "button-icon",
                "button-text",
                "button-shine",
                "popup-footer",
                "decorative-dots",
                "dot",
            ];

            expectedTestIds.forEach((testId) => {
                expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(true);
            });
        });
    });

    describe("Text Content", () => {
        it("should contain all expected text content", () => {
            const wrapper = mount(PopupPage);
            const html = wrapper.html();

            expect(html).toContain("AnimeList");
            expect(html).toContain("Manage your anime watch list and track your progress");
            expect(html).toContain("Open Dashboard");
            expect(html).toContain("⚙️");
        });

        it("should not contain any unwanted text content", () => {
            const wrapper = mount(PopupPage);
            const html = wrapper.html();

            // Should not contain old watch list related text
            expect(html).not.toContain("Watch List");
            expect(html).not.toContain("Episode");
            expect(html).not.toContain("Remove");
        });
    });
});
