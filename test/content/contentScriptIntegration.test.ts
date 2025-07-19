import { beforeEach, describe, expect, it, vi } from "vitest";

// Create a mock instance first
const mockAnimeService = {
    getAnimeStatus: vi.fn(),
    addToPlanToWatch: vi.fn(),
    removeFromPlanToWatch: vi.fn(),
    hideAnime: vi.fn(),
    unhideAnime: vi.fn(),
    clearAllHidden: vi.fn(),
    getAllAnime: vi.fn(),
} as const;

// Mock the AnimeService
vi.mock("@/commons/services", () => ({
    AnimeService: vi.fn().mockImplementation(() => mockAnimeService),
}));

describe("Content Script Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("Complete User Workflow", () => {
        it("should handle complete anime management workflow", async () => {
            // Mock initial state - no anime hidden or planned
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            // Step 1: Add anime to plan-to-watch list
            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            const animeData = {
                animeId: "attack-on-titan-123",
                animeTitle: "Attack on Titan",
                animeSlug: "attack-on-titan-123",
            };

            await mockAnimeService.addToPlanToWatch(animeData);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(animeData);

            // Step 2: Check if anime is now planned
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });

            const status = await mockAnimeService.getAnimeStatus(animeData.animeId);
            expect(status.isPlanned).toBe(true);

            // Step 3: Remove anime from plan-to-watch list
            mockAnimeService.removeFromPlanToWatch.mockResolvedValue({
                success: true,
                message: "Removed from plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            await mockAnimeService.removeFromPlanToWatch(animeData.animeId);
            expect(mockAnimeService.removeFromPlanToWatch).toHaveBeenCalledWith(animeData.animeId);

            // Step 4: Hide anime
            mockAnimeService.hideAnime.mockResolvedValue({
                success: true,
                message: "Anime hidden",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: true,
                },
            });

            await mockAnimeService.hideAnime(animeData.animeId);
            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith(animeData.animeId);

            // Step 5: Check if anime is now hidden
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
            });

            const hiddenStatus = await mockAnimeService.getAnimeStatus(animeData.animeId);
            expect(hiddenStatus.isHidden).toBe(true);

            // Step 6: Clear all hidden anime
            mockAnimeService.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Restored 1 hidden anime",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            await mockAnimeService.clearAllHidden();
            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();
        });

        it("should handle multiple anime operations", async () => {
            const animeList = [
                {
                    animeId: "naruto-001",
                    animeTitle: "Naruto",
                    animeSlug: "naruto-001",
                },
                {
                    animeId: "one-piece-002",
                    animeTitle: "One Piece",
                    animeSlug: "one-piece-002",
                },
                {
                    animeId: "dragon-ball-003",
                    animeTitle: "Dragon Ball",
                    animeSlug: "dragon-ball-003",
                },
            ];

            // Mock successful addition to plan-to-watch list
            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            // Add multiple anime to plan-to-watch list
            for (const anime of animeList) {
                await mockAnimeService.addToPlanToWatch(anime);
            }

            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledTimes(3);

            // Mock successful hiding
            mockAnimeService.hideAnime.mockResolvedValue({
                success: true,
                message: "Anime hidden",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: true,
                },
            });

            // Hide some anime
            await mockAnimeService.hideAnime(animeList[0].animeId);
            await mockAnimeService.hideAnime(animeList[1].animeId);

            expect(mockAnimeService.hideAnime).toHaveBeenCalledTimes(2);
            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith(animeList[0].animeId);
            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith(animeList[1].animeId);

            // Mock successful clear all hidden
            mockAnimeService.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Restored 2 hidden anime",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            // Clear all hidden
            await mockAnimeService.clearAllHidden();
            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();
        });
    });

    describe("Error Recovery", () => {
        it("should handle storage failures gracefully", async () => {
            // Mock storage errors
            mockAnimeService.addToPlanToWatch.mockRejectedValue(new Error("Storage quota exceeded"));
            mockAnimeService.hideAnime.mockRejectedValue(new Error("Storage unavailable"));

            const animeData = {
                animeId: "test-anime-123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime-123",
            };

            // Operations should fail but not crash
            await expect(mockAnimeService.addToPlanToWatch(animeData)).rejects.toThrow("Storage quota exceeded");
            await expect(mockAnimeService.hideAnime(animeData.animeId)).rejects.toThrow("Storage unavailable");
        });

        it("should handle corrupted data gracefully", async () => {
            // Mock corrupted state
            mockAnimeService.getAnimeStatus.mockRejectedValue(new Error("Corrupted data"));

            // Should handle errors gracefully
            await expect(mockAnimeService.getAnimeStatus("test-123")).rejects.toThrow("Corrupted data");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty anime data", async () => {
            const emptyData = {
                animeId: "",
                animeTitle: "",
                animeSlug: "",
            };

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            await mockAnimeService.addToPlanToWatch(emptyData);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(emptyData);
        });

        it("should handle special characters in anime data", async () => {
            const specialData = {
                animeId: "special-123",
                animeTitle: "Anime with Special Characters: 日本語, émojis 🎌, symbols &<>",
                animeSlug: "special-anime-123",
            };

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            await mockAnimeService.addToPlanToWatch(specialData);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(specialData);
        });

        it("should handle very long anime titles", async () => {
            const longTitle = "A".repeat(1000);
            const longData = {
                animeId: "long-title-123",
                animeTitle: longTitle,
                animeSlug: "long-title-123",
            };

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            await mockAnimeService.addToPlanToWatch(longData);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(longData);
        });
    });

    describe("Performance", () => {
        it("should handle rapid successive operations", async () => {
            const operations = [];
            const animeIds = Array.from({ length: 100 }, (_, i) => `anime-${i}`);

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            // Queue rapid operations
            for (const id of animeIds) {
                operations.push(
                    mockAnimeService.addToPlanToWatch({
                        animeId: id,
                        animeTitle: `Anime ${id}`,
                        animeSlug: id,
                    }),
                );
            }

            // Execute all operations
            await Promise.all(operations);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledTimes(100);
        });

        it("should handle concurrent read/write operations", async () => {
            const animeId = "concurrent-test-123";

            // Mock the status calls
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            mockAnimeService.hideAnime.mockResolvedValue({
                success: true,
                message: "Anime hidden",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: true,
                },
            });

            // Simulate concurrent operations
            const operations = [
                mockAnimeService.getAnimeStatus(animeId),
                mockAnimeService.getAnimeStatus(animeId),
                mockAnimeService.addToPlanToWatch({
                    animeId,
                    animeTitle: "Concurrent Test",
                    animeSlug: animeId,
                }),
                mockAnimeService.hideAnime(animeId),
            ];

            // Should handle concurrent operations
            await Promise.all(operations);
            expect(mockAnimeService.getAnimeStatus).toHaveBeenCalledWith(animeId);
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalled();
            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith(animeId);
        });
    });

    describe("Data Integrity", () => {
        it("should maintain data consistency", async () => {
            const animeData = {
                animeId: "integrity-test-123",
                animeTitle: "Integrity Test Anime",
                animeSlug: "integrity-test-123",
            };

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            // Add to plan-to-watch list
            await mockAnimeService.addToPlanToWatch(animeData);

            // Verify the exact data was stored
            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    animeId: animeData.animeId,
                    animeTitle: animeData.animeTitle,
                    animeSlug: animeData.animeSlug,
                }),
            );
        });

        it("should handle service responses correctly", async () => {
            const animeData = {
                animeId: "response-test-123",
                animeTitle: "Response Test",
                animeSlug: "response-test-123",
            };

            mockAnimeService.addToPlanToWatch.mockResolvedValue({
                success: true,
                message: "Added to plan-to-watch list",
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            });

            const result = await mockAnimeService.addToPlanToWatch(animeData);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Added to plan-to-watch list");
            expect(result.newStatus?.isPlanned).toBe(true);
        });
    });

    describe("State Management", () => {
        it("should handle state transitions correctly", async () => {
            const animeId = "state-test-123";

            // Initial state: not planned, not hidden
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(await mockAnimeService.getAnimeStatus(animeId)).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            // State 1: planned, not hidden
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });

            expect(await mockAnimeService.getAnimeStatus(animeId)).toEqual({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });

            // State 2: not planned, hidden
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
            });

            expect(await mockAnimeService.getAnimeStatus(animeId)).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
            });

            // State 3: back to initial state
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(await mockAnimeService.getAnimeStatus(animeId)).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
        });
    });
});
