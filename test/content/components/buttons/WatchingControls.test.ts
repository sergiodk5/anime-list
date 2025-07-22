import { AnimeService } from "@/commons/services";
import { WatchingControls } from "@/content/components/buttons/WatchingControls";
import { toastSystem } from "@/content/components/ui/ToastSystem";
import type { AnimeData } from "@/content/types/ContentTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/commons/services");
vi.mock("@/content/components/ui/ToastSystem");

describe("WatchingControls", () => {
    let animeData: AnimeData;
    const animeServiceInstance = new AnimeService();

    beforeEach(() => {
        document.body.innerHTML = "";
        animeData = {
            animeId: "1",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
        };
        vi.mocked(AnimeService).mockClear();
        vi.mocked(toastSystem.showToast).mockClear();
        WatchingControls["animeService"] = animeServiceInstance;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("create", () => {
        it("should create watching controls with initial episode number", () => {
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);

            const input = document.querySelector(".episode-current") as HTMLInputElement;
            expect(input).not.toBeNull();
            expect(input.value).toBe("5");
            expect(document.querySelector(".episode-decrement")).not.toBeNull();
            expect(document.querySelector(".episode-increment")).not.toBeNull();
        });

        it("should handle episode increment", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: true,
                message: "Updated",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);

            const incrementBtn = controls.querySelector(".episode-increment") as HTMLButtonElement;
            incrementBtn.click();

            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 6);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 6", "success");
            });
        });

        it("should handle episode decrement", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: true,
                message: "Updated",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);

            const decrementBtn = controls.querySelector(".episode-decrement") as HTMLButtonElement;
            decrementBtn.click();

            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 4);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 4", "success");
            });
        });

        it("should handle direct episode input", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: true,
                message: "Updated",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);

            const input = controls.querySelector(".episode-current") as HTMLInputElement;
            input.value = "10";
            input.dispatchEvent(new Event("change"));

            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 10);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 10", "success");
            });
        });
    });

    describe("createStartButton", () => {
        it("should create a start watching button", () => {
            const button = WatchingControls.createStartButton(animeData);
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Start Watching");
        });

        it("should call startWatching on click", async () => {
            vi.spyOn(animeServiceInstance, "startWatching").mockResolvedValue({
                success: true,
                message: "Started",
            });
            const button = WatchingControls.createStartButton(animeData);
            button.click();

            await vi.waitFor(() => {
                expect(animeServiceInstance.startWatching).toHaveBeenCalledWith(animeData, 1);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Started", "success");
            });
        });
    });

    describe("createStopButton", () => {
        it("should create a stop watching button", () => {
            const button = WatchingControls.createStopButton(animeData);
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Stop");
        });

        it("should call stopWatching on click", async () => {
            vi.spyOn(animeServiceInstance, "stopWatching").mockResolvedValue({
                success: true,
                message: "Stopped",
            });
            const button = WatchingControls.createStopButton(animeData);
            button.click();

            await vi.waitFor(() => {
                expect(animeServiceInstance.stopWatching).toHaveBeenCalledWith("1");
                expect(toastSystem.showToast).toHaveBeenCalledWith("Stopped", "success");
            });
        });
    });

    describe("createCombined", () => {
        it("should create combined controls", () => {
            const controls = WatchingControls.createCombined(animeData, 5);
            document.body.appendChild(controls);

            expect(document.querySelector(".episode-current")).not.toBeNull();
            expect(document.querySelector(".stop-watching-btn")).not.toBeNull();
        });

        it("should handle stop watching from combined controls", async () => {
            vi.spyOn(animeServiceInstance, "stopWatching").mockResolvedValue({
                success: true,
                message: "Stopped",
            });
            const controls = WatchingControls.createCombined(animeData, 5);
            document.body.appendChild(controls);

            const stopBtn = controls.querySelector(".stop-watching-btn") as HTMLButtonElement;
            stopBtn.click();

            await vi.waitFor(() => {
                expect(animeServiceInstance.stopWatching).toHaveBeenCalledWith("1");
                expect(toastSystem.showToast).toHaveBeenCalledWith("Stopped", "success");
            });
        });
    });

    describe("Error Handling", () => {
        it("should show error toast if increment fails", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);
            const incrementBtn = controls.querySelector(".episode-increment") as HTMLButtonElement;
            incrementBtn.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });

        it("should show error toast if decrement fails", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);
            const decrementBtn = controls.querySelector(".episode-decrement") as HTMLButtonElement;
            decrementBtn.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });

        it("should show error toast if direct input fails", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);
            const input = controls.querySelector(".episode-current") as HTMLInputElement;
            input.value = "10";
            input.dispatchEvent(new Event("change"));
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });

        it("should show error toast for invalid direct input", async () => {
            const controls = WatchingControls.create(animeData, 5);
            document.body.appendChild(controls);
            const input = controls.querySelector(".episode-current") as HTMLInputElement;
            input.value = "invalid";
            input.dispatchEvent(new Event("change"));
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith(
                    "Please enter a valid episode number (1-999)",
                    "error",
                );
            });
        });

        it("should show error toast if start watching fails", async () => {
            vi.spyOn(animeServiceInstance, "startWatching").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const button = WatchingControls.createStartButton(animeData);
            button.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });

        it("should show error toast if stop watching fails", async () => {
            vi.spyOn(animeServiceInstance, "stopWatching").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const button = WatchingControls.createStopButton(animeData);
            button.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });
    });
});
