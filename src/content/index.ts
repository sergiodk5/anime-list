import type { AnimeData } from "@/commons/models";
import { HiddenAnimeUtil, PlanToWatchUtil } from "@/commons/utils";

/**
 * Content script for anime website integration
 * Adds Watch and Hide controls to anime cards with glass-morphism styling
 */

// Initialize the content script
console.log("AnimeList content script loaded");

// Constants for DOM selectors based on the requirements
const SELECTORS = {
    CONTAINER: ".film_list-wrap",
    ITEM: ".flw-item",
    POSTER: ".film-poster",
    TITLE_LINK: ".film-name a",
} as const;

// Cache for anime data extracted from DOM
const animeDataCache = new Map<string, AnimeData>();

/**
 * Extract anime data from a DOM element
 */
export function extractAnimeData(element: Element): AnimeData | null {
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
        animeDataCache.set(animeId, animeData);

        return animeData;
    } catch (error) {
        console.error("Error extracting anime data:", error);
        return null;
    }
}

/**
 * Create Watch button with glass-morphism styling
 */
export function createWatchButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-watch-btn";
    button.setAttribute("data-testid", "anime-watch-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Add "${animeData.animeTitle}" to watchlist`);
    button.innerHTML = `
        <span class="button-icon">📝</span>
        <span class="button-text">Watch</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleWatchClick(animeData, button);
    });

    return button;
}

/**
 * Create Hide button with glass-morphism styling
 */
export function createHideButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-hide-btn";
    button.setAttribute("data-testid", "anime-hide-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Hide "${animeData.animeTitle}" from listings`);
    button.innerHTML = `
        <span class="button-icon">👁️</span>
        <span class="button-text">Hide</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleHideClick(animeData, button);
    });

    return button;
}

/**
 * Create Clear Hidden button with glass-morphism styling
 */
export function createClearHiddenButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-clear-hidden-btn";
    button.setAttribute("data-testid", "anime-clear-hidden-button");
    button.setAttribute("title", "Show all previously hidden anime");
    button.innerHTML = `
        <span class="button-icon">🔄</span>
        <span class="button-text">Clear Hidden</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleClearHiddenClick(button);
    });

    return button;
}

/**
 * Handle Watch button click
 */
export async function handleWatchClick(animeData: AnimeData, button: HTMLButtonElement): Promise<void> {
    try {
        const isAlreadyPlanned = await PlanToWatchUtil.isPlanned(animeData.animeId);

        if (isAlreadyPlanned) {
            // Remove from watchlist
            await PlanToWatchUtil.remove(animeData.animeId);
            button.classList.remove("active");
            button.setAttribute("title", `Add "${animeData.animeTitle}" to watchlist`);
            showFeedback(button, "Removed from watchlist", "success");
        } else {
            // Add to watchlist
            const planData = {
                ...animeData,
                addedAt: new Date().toISOString(),
            };
            await PlanToWatchUtil.add(planData);
            button.classList.add("active");
            button.setAttribute("title", `Remove "${animeData.animeTitle}" from watchlist`);
            showFeedback(button, "Added to watchlist", "success");
        }
    } catch (error) {
        console.error("Error handling watch click:", error);
        showFeedback(button, "Error occurred", "error");
    }
}

/**
 * Handle Hide button click
 */
export async function handleHideClick(animeData: AnimeData, button: HTMLButtonElement): Promise<void> {
    try {
        // Add to hidden list
        await HiddenAnimeUtil.add(animeData.animeId);

        // Find the parent anime item and hide it
        const animeItem = button.closest(SELECTORS.ITEM);
        if (animeItem) {
            animeItem.classList.add("anime-hidden");
            // Use CSS transition for smooth hiding
            setTimeout(() => {
                (animeItem as HTMLElement).style.display = "none";
            }, 300);
        }

        showFeedback(button, "Anime hidden", "success");
    } catch (error) {
        console.error("Error handling hide click:", error);
        showFeedback(button, "Error occurred", "error");
    }
}

/**
 * Handle Clear Hidden button click
 */
export async function handleClearHiddenClick(button: HTMLButtonElement): Promise<void> {
    try {
        // Clear all hidden anime
        await HiddenAnimeUtil.clear();

        // Show all previously hidden items
        const hiddenItems = document.querySelectorAll(".anime-hidden");
        hiddenItems.forEach((item) => {
            item.classList.remove("anime-hidden");
            (item as HTMLElement).style.display = "";
        });

        showFeedback(button, "All hidden anime restored", "success");
    } catch (error) {
        console.error("Error handling clear hidden click:", error);
        showFeedback(button, "Error occurred", "error");
    }
}

/**
 * Show feedback message near button
 */
function showFeedback(button: HTMLButtonElement, message: string, type: "success" | "error"): void {
    const feedback = document.createElement("div");
    feedback.className = `anime-list-feedback anime-list-feedback-${type}`;
    feedback.textContent = message;
    feedback.setAttribute("data-testid", "anime-feedback");

    // Position feedback near the button
    const rect = button.getBoundingClientRect();
    feedback.style.position = "fixed";
    feedback.style.top = `${rect.bottom + 5}px`;
    feedback.style.left = `${rect.left}px`;
    feedback.style.zIndex = "10000";

    document.body.appendChild(feedback);

    // Remove feedback after 2 seconds
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

/**
 * Add controls to an anime item
 */
async function addControlsToItem(element: Element): Promise<void> {
    try {
        // Check if controls already exist
        if (element.querySelector(".anime-list-controls")) {
            return;
        }

        const animeData = extractAnimeData(element);
        if (!animeData) return;

        // Check if this anime is hidden
        const isHidden = await HiddenAnimeUtil.isHidden(animeData.animeId);
        if (isHidden) {
            element.classList.add("anime-hidden");
            (element as HTMLElement).style.display = "none";
            return;
        }

        // Create controls container
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "anime-list-controls";
        controlsContainer.setAttribute("data-testid", "anime-controls");

        // Create buttons
        const watchButton = createWatchButton(animeData);
        const hideButton = createHideButton(animeData);

        // Check if already in watchlist and update button state
        const isPlanned = await PlanToWatchUtil.isPlanned(animeData.animeId);
        if (isPlanned) {
            watchButton.classList.add("active");
            watchButton.setAttribute("title", `Remove "${animeData.animeTitle}" from watchlist`);
        }

        // Add buttons to container
        controlsContainer.appendChild(watchButton);
        controlsContainer.appendChild(hideButton);

        // Find the poster element and add controls
        const poster = element.querySelector(SELECTORS.POSTER);
        if (poster) {
            poster.appendChild(controlsContainer);
        }
    } catch (error) {
        console.error("Error adding controls to item:", error);
    }
}

/**
 * Add Clear Hidden button to the list container
 */
export function addClearHiddenButton(): void {
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    // Check if button already exists
    if (container.querySelector(".anime-list-clear-hidden-btn")) {
        return;
    }

    const clearButton = createClearHiddenButton();

    // Create wrapper for better positioning
    const wrapper = document.createElement("div");
    wrapper.className = "anime-list-clear-hidden-wrapper";
    wrapper.setAttribute("data-testid", "clear-hidden-wrapper");
    wrapper.appendChild(clearButton);

    // Add to the end of the container
    container.appendChild(wrapper);
}

/**
 * Initialize controls for all anime items
 */
export async function initializeControls(): Promise<void> {
    try {
        const container = document.querySelector(SELECTORS.CONTAINER);
        if (!container) {
            console.log("Anime list container not found");
            return;
        }

        const items = container.querySelectorAll(SELECTORS.ITEM);
        console.log(`Found ${items.length} anime items`);

        // Add controls to each item
        for (const item of items) {
            await addControlsToItem(item);
        }

        // Add clear hidden button
        addClearHiddenButton();

        console.log("AnimeList controls initialized successfully");
    } catch (error) {
        console.error("Error initializing controls:", error);
    }
}

/**
 * Observe DOM changes and add controls to new items
 */
export function setupObserver(): void {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;

                        // Check if the added node is an anime item
                        if (element.matches(SELECTORS.ITEM)) {
                            addControlsToItem(element);
                        }

                        // Check if the added node contains anime items
                        const items = element.querySelectorAll?.(SELECTORS.ITEM);
                        if (items) {
                            items.forEach(addControlsToItem);
                        }
                    }
                });
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

/**
 * Inject CSS styles for the controls
 */
function injectStyles(): void {
    const style = document.createElement("style");
    style.setAttribute("data-testid", "anime-list-styles");
    style.textContent = `
        /* AnimeList Chrome Extension Styles */
        .anime-list-controls {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 6px;
            z-index: 10;
        }

        .anime-list-watch-btn,
        .anime-list-hide-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .anime-list-watch-btn:hover,
        .anime-list-hide-btn:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .anime-list-watch-btn:active,
        .anime-list-hide-btn:active {
            transform: scale(0.95);
        }

        .anime-list-watch-btn.active {
            background: rgba(147, 51, 234, 0.3);
            border-color: rgba(147, 51, 234, 0.5);
            color: rgb(196, 181, 253);
        }

        .anime-list-watch-btn.active:hover {
            background: rgba(147, 51, 234, 0.4);
            border-color: rgba(147, 51, 234, 0.6);
        }

        .anime-list-clear-hidden-wrapper {
            display: flex;
            justify-content: center;
            margin-top: 24px;
            padding: 16px;
        }

        .anime-list-clear-hidden-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .anime-list-clear-hidden-btn:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        .anime-list-clear-hidden-btn:active {
            transform: scale(0.95);
        }

        .button-icon {
            font-size: 14px;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .button-text {
            font-family: inherit;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
        }

        .anime-hidden {
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }

        .anime-list-feedback {
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            backdrop-filter: blur(8px);
            animation: anime-list-feedback-appear 0.3s ease;
            pointer-events: none;
        }

        .anime-list-feedback-success {
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: rgb(134, 239, 172);
        }

        .anime-list-feedback-error {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: rgb(252, 165, 165);
        }

        @keyframes anime-list-feedback-appear {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .anime-list-controls {
                top: 4px;
                right: 4px;
                gap: 4px;
            }

            .anime-list-watch-btn,
            .anime-list-hide-btn {
                padding: 4px 8px;
                font-size: 11px;
            }

            .button-icon {
                font-size: 12px;
            }

            .anime-list-clear-hidden-btn {
                padding: 10px 20px;
                font-size: 13px;
            }
        }
    `;

    document.head.appendChild(style);
}

/**
 * Main initialization function
 */
export async function init(): Promise<void> {
    try {
        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", init);
            return;
        }

        // Inject styles
        injectStyles();

        // Initialize controls
        await initializeControls();

        // Setup observer for dynamic content
        setupObserver();
    } catch (error) {
        console.error("Error initializing AnimeList content script:", error);
    }
}

// Only auto-initialize if not in test environment
if (typeof window !== "undefined" && typeof document !== "undefined" && (globalThis as any).window?.location) {
    init();
}
