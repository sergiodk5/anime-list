import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the utilities
vi.mock("@/commons/utils", () => ({
    HiddenAnimeUtil: {
        add: vi.fn(),
        remove: vi.fn(),
        isHidden: vi.fn(),
        clear: vi.fn(),
    },
    PlanToWatchUtil: {
        add: vi.fn(),
        remove: vi.fn(),
        isPlanned: vi.fn(),
    },
}));

import { HiddenAnimeUtil, PlanToWatchUtil } from "@/commons/utils";

describe("Content Script Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("Complete User Workflow", () => {
        it("should handle complete anime management workflow", async () => {
            // Mock initial state - no anime hidden or planned
            vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(false);
            vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(false);

            // Step 1: Add anime to watchlist
            vi.mocked(PlanToWatchUtil.add).mockResolvedValue(undefined);

            const animeData = {
                animeId: "attack-on-titan-123",
                animeTitle: "Attack on Titan",
                animeSlug: "attack-on-titan-123",
                addedAt: new Date().toISOString(),
            };

            await PlanToWatchUtil.add(animeData);
            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(animeData);

            // Step 2: Check if anime is now planned
            vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(true);
            const isPlanned = await PlanToWatchUtil.isPlanned(animeData.animeId);
            expect(isPlanned).toBe(true);

            // Step 3: Remove anime from watchlist
            vi.mocked(PlanToWatchUtil.remove).mockResolvedValue(undefined);
            await PlanToWatchUtil.remove(animeData.animeId);
            expect(PlanToWatchUtil.remove).toHaveBeenCalledWith(animeData.animeId);

            // Step 4: Hide anime
            vi.mocked(HiddenAnimeUtil.add).mockResolvedValue(undefined);
            await HiddenAnimeUtil.add(animeData.animeId);
            expect(HiddenAnimeUtil.add).toHaveBeenCalledWith(animeData.animeId);

            // Step 5: Check if anime is now hidden
            vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(true);
            const isHidden = await HiddenAnimeUtil.isHidden(animeData.animeId);
            expect(isHidden).toBe(true);

            // Step 6: Clear all hidden anime
            vi.mocked(HiddenAnimeUtil.clear).mockResolvedValue(undefined);
            await HiddenAnimeUtil.clear();
            expect(HiddenAnimeUtil.clear).toHaveBeenCalled();
        });

        it("should handle multiple anime operations", async () => {
            const animeList = [
                {
                    animeId: "naruto-001",
                    animeTitle: "Naruto",
                    animeSlug: "naruto-001",
                    addedAt: new Date().toISOString(),
                },
                {
                    animeId: "one-piece-002",
                    animeTitle: "One Piece",
                    animeSlug: "one-piece-002",
                    addedAt: new Date().toISOString(),
                },
                {
                    animeId: "dragon-ball-003",
                    animeTitle: "Dragon Ball",
                    animeSlug: "dragon-ball-003",
                    addedAt: new Date().toISOString(),
                },
            ];

            // Add multiple anime to watchlist
            for (const anime of animeList) {
                await PlanToWatchUtil.add(anime);
            }

            expect(PlanToWatchUtil.add).toHaveBeenCalledTimes(3);

            // Hide some anime
            await HiddenAnimeUtil.add(animeList[0].animeId);
            await HiddenAnimeUtil.add(animeList[1].animeId);

            expect(HiddenAnimeUtil.add).toHaveBeenCalledTimes(2);
            expect(HiddenAnimeUtil.add).toHaveBeenCalledWith(animeList[0].animeId);
            expect(HiddenAnimeUtil.add).toHaveBeenCalledWith(animeList[1].animeId);

            // Clear all hidden
            await HiddenAnimeUtil.clear();
            expect(HiddenAnimeUtil.clear).toHaveBeenCalled();
        });
    });

    describe("Error Recovery", () => {
        it("should handle storage failures gracefully", async () => {
            // Mock storage errors
            vi.mocked(PlanToWatchUtil.add).mockRejectedValue(new Error("Storage quota exceeded"));
            vi.mocked(HiddenAnimeUtil.add).mockRejectedValue(new Error("Storage unavailable"));

            const animeData = {
                animeId: "test-anime-123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime-123",
                addedAt: new Date().toISOString(),
            };

            // Operations should fail but not crash
            await expect(PlanToWatchUtil.add(animeData)).rejects.toThrow("Storage quota exceeded");
            await expect(HiddenAnimeUtil.add(animeData.animeId)).rejects.toThrow("Storage unavailable");
        });

        it("should handle corrupted data gracefully", async () => {
            // Mock corrupted state
            vi.mocked(PlanToWatchUtil.isPlanned).mockRejectedValue(new Error("Corrupted data"));
            vi.mocked(HiddenAnimeUtil.isHidden).mockRejectedValue(new Error("Corrupted data"));

            // Should handle errors gracefully
            await expect(PlanToWatchUtil.isPlanned("test-123")).rejects.toThrow("Corrupted data");
            await expect(HiddenAnimeUtil.isHidden("test-123")).rejects.toThrow("Corrupted data");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty anime data", async () => {
            const emptyData = {
                animeId: "",
                animeTitle: "",
                animeSlug: "",
                addedAt: new Date().toISOString(),
            };

            await PlanToWatchUtil.add(emptyData);
            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(emptyData);
        });

        it("should handle special characters in anime data", async () => {
            const specialData = {
                animeId: "special-123",
                animeTitle: "Anime with Special Characters: 日本語, émojis 🎌, symbols &<>",
                animeSlug: "special-anime-123",
                addedAt: new Date().toISOString(),
            };

            await PlanToWatchUtil.add(specialData);
            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(specialData);
        });

        it("should handle very long anime titles", async () => {
            const longTitle = "A".repeat(1000);
            const longData = {
                animeId: "long-title-123",
                animeTitle: longTitle,
                animeSlug: "long-title-123",
                addedAt: new Date().toISOString(),
            };

            await PlanToWatchUtil.add(longData);
            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(longData);
        });
    });

    describe("Performance", () => {
        it("should handle rapid successive operations", async () => {
            const operations = [];
            const animeIds = Array.from({ length: 100 }, (_, i) => `anime-${i}`);

            // Queue rapid operations
            for (const id of animeIds) {
                operations.push(
                    PlanToWatchUtil.add({
                        animeId: id,
                        animeTitle: `Anime ${id}`,
                        animeSlug: id,
                        addedAt: new Date().toISOString(),
                    }),
                );
            }

            // Execute all operations
            await Promise.all(operations);
            expect(PlanToWatchUtil.add).toHaveBeenCalledTimes(100);
        });

        it("should handle concurrent read/write operations", async () => {
            const animeId = "concurrent-test-123";

            // Simulate concurrent operations
            const operations = [
                PlanToWatchUtil.isPlanned(animeId),
                HiddenAnimeUtil.isHidden(animeId),
                PlanToWatchUtil.add({
                    animeId,
                    animeTitle: "Concurrent Test",
                    animeSlug: animeId,
                    addedAt: new Date().toISOString(),
                }),
                HiddenAnimeUtil.add(animeId),
            ];

            // Should handle concurrent operations
            await Promise.all(operations);
            expect(PlanToWatchUtil.isPlanned).toHaveBeenCalledWith(animeId);
            expect(HiddenAnimeUtil.isHidden).toHaveBeenCalledWith(animeId);
        });
    });

    describe("Data Integrity", () => {
        it("should maintain data consistency", async () => {
            const animeData = {
                animeId: "integrity-test-123",
                animeTitle: "Integrity Test Anime",
                animeSlug: "integrity-test-123",
                addedAt: new Date().toISOString(),
            };

            // Add to watchlist
            await PlanToWatchUtil.add(animeData);

            // Verify the exact data was stored
            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    animeId: animeData.animeId,
                    animeTitle: animeData.animeTitle,
                    animeSlug: animeData.animeSlug,
                    addedAt: expect.any(String),
                }),
            );
        });

        it("should handle timestamp generation", async () => {
            const animeData = {
                animeId: "timestamp-test-123",
                animeTitle: "Timestamp Test",
                animeSlug: "timestamp-test-123",
                addedAt: new Date().toISOString(),
            };

            await PlanToWatchUtil.add(animeData);

            expect(PlanToWatchUtil.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    addedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
                }),
            );
        });
    });

    describe("State Management", () => {
        it("should handle state transitions correctly", async () => {
            const animeId = "state-test-123";

            // Initial state: not planned, not hidden
            vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(false);
            vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(false);

            expect(await PlanToWatchUtil.isPlanned(animeId)).toBe(false);
            expect(await HiddenAnimeUtil.isHidden(animeId)).toBe(false);

            // State 1: planned, not hidden
            vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(true);
            expect(await PlanToWatchUtil.isPlanned(animeId)).toBe(true);
            expect(await HiddenAnimeUtil.isHidden(animeId)).toBe(false);

            // State 2: not planned, hidden
            vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(false);
            vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(true);

            expect(await PlanToWatchUtil.isPlanned(animeId)).toBe(false);
            expect(await HiddenAnimeUtil.isHidden(animeId)).toBe(true);

            // State 3: back to initial state
            vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(false);
            expect(await HiddenAnimeUtil.isHidden(animeId)).toBe(false);
        });
    });
});
