/**
 * Anime data extraction service
 * Handles extracting anime data from DOM elements and pages
 */

import type { AnimeData } from "../types/ContentTypes";
import { SELECTORS } from "../types/ContentTypes";

export class AnimeExtractor {
    // Cache for anime data extracted from DOM
    private static animeDataCache = new Map<string, AnimeData>();

    /**
     * Extract anime data from a DOM element (list page)
     */
    static extractFromListItem(element: Element): AnimeData | null {
        try {
            const titleLink = element.querySelector(SELECTORS.TITLE_LINK) as HTMLAnchorElement;
            if (!titleLink) return null;

            const href = titleLink.getAttribute("href") || "";
            const title = titleLink.getAttribute("title") || titleLink.textContent?.trim() || "";

            // Extract anime ID from href (e.g., "/watch/anime-name-12345" -> "12345")
            const idMatch = href.match(/\/(?:watch\/)?([^/]+)$/);
            if (!idMatch) return null;

            const slug = idMatch[1];
            // Extract numeric ID from slug if present, otherwise use the full slug
            const numericIdMatch = slug.match(/-(\d+)$/);
            const animeId = numericIdMatch ? numericIdMatch[1] : slug;

            const animeData: AnimeData = {
                animeId,
                animeTitle: title,
                animeSlug: slug,
            };

            // Cache the data
            AnimeExtractor.animeDataCache.set(animeId, animeData);

            return animeData;
        } catch (error) {
            console.error("Error extracting anime data:", error);
            return null;
        }
    }

    /**
     * Extract anime data from single page (watch page)
     */
    static extractFromSinglePage(): AnimeData | null {
        try {
            const url = new URL(window.location.href);
            const pathSegments = url.pathname.split("/");
            const watchIndex = pathSegments.indexOf("watch");

            if (watchIndex === -1 || watchIndex + 1 >= pathSegments.length) {
                return null;
            }

            const originalSlug = pathSegments[watchIndex + 1];
            if (!originalSlug) return null;

            // Try multiple ID extraction strategies
            let animeId = originalSlug;

            // Strategy 1: Extract numeric ID from end (e.g., "anime-name-12345" -> "12345")
            const numericIdMatch = originalSlug.match(/-(\d+)$/);
            if (numericIdMatch) {
                animeId = numericIdMatch[1];
            }

            // Strategy 2: If no numeric suffix, use the full slug
            // This handles cases where the anime ID is the full slug

            // Try different selectors to get anime title
            const titleSelectors = [
                ".ani_detail-info h2",
                ".watch-detail .title",
                "h1.anime-title",
                "h1",
                "h2",
                "[class*='title']",
                ".film-name",
                ".anime-title",
            ];

            let animeTitle = originalSlug; // Fallback to original slug
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element?.textContent?.trim()) {
                    animeTitle = element.textContent.trim();
                    break;
                }
            }

            const animeData = {
                animeId,
                animeTitle,
                animeSlug: originalSlug.toLowerCase(),
            };

            // Store debug info for modal display
            (animeData as any).debugInfo = {
                url: url.href,
                originalSlug,
                extractionStrategy: numericIdMatch ? "numeric-suffix" : "full-slug",
                titleSelectorUsed:
                    titleSelectors.find((sel) => document.querySelector(sel)?.textContent?.trim()) || "none",
            };

            console.log("Extracted anime data from watch page:", animeData);
            return animeData;
        } catch (error) {
            console.error("Error extracting anime data from single page:", error);
            return null;
        }
    }

    /**
     * Clean and normalize anime title
     */
    private static cleanAnimeTitle(title: string): string {
        return title.trim().replace(/\s+/g, " ");
    }

    /**
     * Generate anime ID from title
     */
    private static generateAnimeId(title: string): string {
        return title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    /**
     * Get cached anime data
     */
    static getCachedAnimeData(animeId: string): AnimeData | undefined {
        return AnimeExtractor.animeDataCache.get(animeId);
    }

    /**
     * Clear anime data cache
     */
    static clearCache(): void {
        AnimeExtractor.animeDataCache.clear();
    }
}
