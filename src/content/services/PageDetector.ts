/**
 * Page detection service for content script
 * Determines page type and which features should run
 */

import { ContentFeature, PageType, SELECTORS } from "../types/ContentTypes";

export class PageDetector {
    /**
     * Detect the current page type
     */
    static detectPageType(): PageType {
        // Check if current page is a watch page
        if (window.location.href.includes("/watch/")) {
            return PageType.SINGLE_PAGE;
        }

        // Check for list page indicators
        const listIndicators = [SELECTORS.CONTAINER, ".anime-list", ".list-container", ".film_list", ".movies-list"];

        if (listIndicators.some((selector) => document.querySelector(selector))) {
            return PageType.LIST_PAGE;
        }

        return PageType.UNKNOWN;
    }

    /**
     * Determine if a specific feature should run on the current page
     */
    static shouldRunFeature(feature: ContentFeature): boolean {
        const pageType = PageDetector.detectPageType();

        switch (feature) {
            case ContentFeature.LIST_PAGE_LOGIC:
                return pageType === PageType.LIST_PAGE;
            case ContentFeature.SINGLE_PAGE_MODAL:
                return pageType === PageType.SINGLE_PAGE;
            default:
                return false;
        }
    }

    /**
     * Check if current page is a watch page (backward compatibility)
     */
    static isWatchPage(): boolean {
        return PageDetector.detectPageType() === PageType.SINGLE_PAGE;
    }

    /**
     * Check if the page has anime list content
     */
    static hasAnimeListContent(): boolean {
        return !!document.querySelector(SELECTORS.CONTAINER);
    }

    /**
     * Wait for page content to load
     */
    static async waitForContent(timeout: number = 5000): Promise<boolean> {
        return new Promise((resolve) => {
            const checkInterval = 100;
            const maxAttempts = timeout / checkInterval;
            let attempts = 0;

            const check = () => {
                attempts++;

                const pageType = PageDetector.detectPageType();

                // If we detect a valid page type, we're good
                if (pageType !== PageType.UNKNOWN) {
                    resolve(true);
                    return;
                }

                // If we've exhausted our attempts, give up
                if (attempts >= maxAttempts) {
                    resolve(false);
                    return;
                }

                // Try again
                setTimeout(check, checkInterval);
            };

            check();
        });
    }
}
