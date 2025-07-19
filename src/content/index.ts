import type { AnimeData, AnimeStatus } from "@/commons/models";
import { AnimeService } from "@/commons/services";

/**
 * Content script for anime website integration
 * Adds Plan and Hide controls to anime cards with glass-morphism styling
 */

// Initialize the content script
console.log("AnimeList content script loaded");

// Initialize the anime service
const animeService = new AnimeService();

// Constants for DOM selectors based on the requirements
const SELECTORS = {
    CONTAINER: ".film_list-wrap",
    ITEM: ".flw-item",
    POSTER: ".film-poster",
    TITLE_LINK: ".film-name a",
} as const;

// Cache for anime data extracted from DOM
const animeDataCache = new Map<string, AnimeData>();

// Toast notification system
interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
    element: HTMLDivElement;
}

let toastCounter = 0;
const activeToasts = new Map<string, Toast>();

/**
 * Business rule validation functions
 */

/**
 * Check if anime can be added to plan list
 * Only if not planned, not watching, and not hidden
 */
export function canAddToPlan(status: AnimeStatus): boolean {
    return !status.isPlanned && !status.isTracked && !status.isHidden;
}

/**
 * Check if anime can start watching
 * Only if not already watching and not hidden
 */
export function canStartWatching(status: AnimeStatus): boolean {
    return !status.isTracked && !status.isHidden;
}

/**
 * Check if anime can be hidden
 * Only if not planned and not watching
 */
export function canHide(status: AnimeStatus): boolean {
    return !status.isPlanned && !status.isTracked;
}

/**
 * Check if anime can be removed from plan
 * Only if currently planned
 */
export function canRemoveFromPlan(status: AnimeStatus): boolean {
    return status.isPlanned;
}

/**
 * Check if anime can stop watching
 * Only if currently watching
 */
export function canStopWatching(status: AnimeStatus): boolean {
    return status.isTracked;
}

/**
 * Toast notification system
 */
export function showToast(message: string, type: "success" | "error" | "info"): void {
    const toastId = `toast-${toastCounter++}`;

    const toast = document.createElement("div");
    toast.className = `anime-list-toast anime-list-toast-${type}`;
    toast.setAttribute("data-testid", "anime-toast");
    toast.setAttribute("data-toast-id", toastId);
    toast.textContent = message;

    // Position toast in top-right corner
    toast.style.position = "fixed";
    toast.style.top = `${16 + activeToasts.size * 70}px`; // Stack toasts
    toast.style.right = "16px";
    toast.style.zIndex = "10001";
    toast.style.maxWidth = "300px";

    document.body.appendChild(toast);

    // Store toast reference
    const toastData: Toast = {
        id: toastId,
        message,
        type,
        element: toast,
    };
    activeToasts.set(toastId, toastData);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        removeToast(toastId);
    }, 4000);

    // Add slide-in animation
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 50);
}

/**
 * Remove toast notification
 */
function removeToast(toastId: string): void {
    const toastData = activeToasts.get(toastId);
    if (!toastData) return;

    // Slide-out animation
    toastData.element.style.transform = "translateX(100%)";

    setTimeout(() => {
        toastData.element.remove();
        activeToasts.delete(toastId);

        // Reposition remaining toasts
        repositionToasts();
    }, 300);
}

/**
 * Reposition remaining toasts after removal
 */
function repositionToasts(): void {
    let index = 0;
    activeToasts.forEach((toast) => {
        toast.element.style.top = `${16 + index * 70}px`;
        index++;
    });
}

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
 * Create Start Watching button with episode input
 */
export function createStartWatchingButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-start-watching-btn";
    button.setAttribute("data-testid", "anime-start-watching-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Start watching "${animeData.animeTitle}"`);

    // Create button content
    button.innerHTML = `
        <span class="button-icon">▶️</span>
        <span class="button-text">Start Watching</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleStartWatchingClick(animeData);
    });

    return button;
}

/**
 * Create watching controls for currently watching anime
 */
export function createWatchingControls(animeData: AnimeData, currentEpisode: number): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "anime-list-watching-controls";
    container.setAttribute("data-testid", "anime-watching-controls");
    container.setAttribute("data-anime-id", animeData.animeId);

    container.innerHTML = `
        <div class="episode-display">
            <span class="episode-label">Ep:</span>
            <button class="episode-btn episode-decrement" data-testid="episode-decrement" title="Previous episode">−</button>
            <input type="number" class="episode-current" min="1" max="999" value="${currentEpisode}" title="Current episode">
            <button class="episode-btn episode-increment" data-testid="episode-increment" title="Next episode">+</button>
        </div>
    `;

    // Add event handlers
    const decrementBtn = container.querySelector(".episode-decrement") as HTMLButtonElement;
    const incrementBtn = container.querySelector(".episode-increment") as HTMLButtonElement;
    const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;

    decrementBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleEpisodeDecrement(animeData, container);
    });

    incrementBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleEpisodeIncrement(animeData, container);
    });

    episodeInput.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleDirectEpisodeInput(animeData, container);
    });

    // Prevent input from triggering parent click
    episodeInput.addEventListener("click", (e) => e.stopPropagation());

    return container;
}

/**
 * Create Stop Watching button
 */
export function createStopWatchingButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-stop-watching-btn";
    button.setAttribute("data-testid", "anime-stop-watching-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Stop watching "${animeData.animeTitle}"`);
    button.innerHTML = `
        <span class="button-icon">⏹️</span>
        <span class="button-text">Stop</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleStopWatchingClick(animeData);
    });

    return button;
}

/**
 * Create combined watching controls with episode display visible and stop button on hover
 */
export function createCombinedWatchingControls(animeData: AnimeData, currentEpisode: number): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "anime-list-combined-watching-controls";
    container.setAttribute("data-testid", "anime-combined-watching-controls");
    container.setAttribute("data-anime-id", animeData.animeId);

    container.innerHTML = `
        <div class="episode-display">
            <span class="episode-label">Ep:</span>
            <button class="episode-btn episode-decrement" data-testid="episode-decrement" title="Previous episode">−</button>
            <input type="number" class="episode-current" min="1" max="999" value="${currentEpisode}" title="Current episode">
            <button class="episode-btn episode-increment" data-testid="episode-increment" title="Next episode">+</button>
        </div>
        <button class="stop-watching-btn" data-testid="combined-stop-watching-button" title="Stop watching ${animeData.animeTitle}">
            <span class="button-icon">⏹️</span>
            <span class="button-text">Stop</span>
        </button>
    `;

    // Add episode control event handlers
    const decrementBtn = container.querySelector(".episode-decrement") as HTMLButtonElement;
    const incrementBtn = container.querySelector(".episode-increment") as HTMLButtonElement;
    const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
    const stopBtn = container.querySelector(".stop-watching-btn") as HTMLButtonElement;

    decrementBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleEpisodeDecrement(animeData, container);
    });

    incrementBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleEpisodeIncrement(animeData, container);
    });

    episodeInput.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleDirectEpisodeInput(animeData, container);
    });

    stopBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleStopWatchingClick(animeData);
    });

    // Prevent input from triggering parent click
    episodeInput.addEventListener("click", (e) => e.stopPropagation());

    return container;
}

/**
 * Create Remove Plan button
 */
export function createRemovePlanButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-remove-plan-btn";
    button.setAttribute("data-testid", "anime-remove-plan-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Remove "${animeData.animeTitle}" from plan`);
    button.innerHTML = `
        <span class="button-icon">❌</span>
        <span class="button-text">Remove</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleRemovePlanClick(animeData);
    });

    return button;
}

/**
 * Create Plan button with glass-morphism styling
 */
export function createPlanButton(animeData: AnimeData): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "anime-list-plan-btn";
    button.setAttribute("data-testid", "anime-plan-button");
    button.setAttribute("data-anime-id", animeData.animeId);
    button.setAttribute("title", `Add "${animeData.animeTitle}" to plan-to-watch list`);
    button.innerHTML = `
        <span class="button-icon">📝</span>
        <span class="button-text">Plan</span>
    `;

    // Add click handler
    button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handlePlanClick(animeData);
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
        await handleClearHiddenClick();
    });

    return button;
}

/**
 * Handler functions for button actions
 */

/**
 * Handle Start Watching button click
 */
export async function handleStartWatchingClick(animeData: AnimeData): Promise<void> {
    try {
        const status = await animeService.getAnimeStatus(animeData.animeId);

        // Validate business rules
        if (!canStartWatching(status)) {
            if (status.isHidden) {
                showToast("Cannot start watching hidden anime", "error");
            } else if (status.isTracked) {
                showToast("Anime is already being watched", "error");
            } else {
                showToast("Cannot start watching this anime", "error");
            }
            return;
        }

        // Get episode number from input
        const episodeNumber = 1;

        // Start watching
        const result = await animeService.startWatching(animeData, episodeNumber);

        if (result.success) {
            showToast(`Started watching "${animeData.animeTitle}" from episode ${episodeNumber}`, "success");
            // Refresh the controls for this anime
            await refreshAnimeControls(animeData.animeId);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error handling start watching click:", error);
        showToast("Error occurred while starting to watch", "error");
    }
}

/**
 * Handle episode increment
 */
export async function handleEpisodeIncrement(animeData: AnimeData, container: HTMLDivElement): Promise<void> {
    try {
        const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
        const currentEpisode = parseInt(episodeInput.value, 10);
        const newEpisode = currentEpisode + 1;

        if (newEpisode > 999) {
            showToast("Maximum episode number is 999", "error");
            return;
        }

        const result = await animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

        if (result.success) {
            episodeInput.value = newEpisode.toString();
            showToast(`Updated to episode ${newEpisode}`, "success");
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error incrementing episode:", error);
        showToast("Error updating episode", "error");
    }
}

/**
 * Handle episode decrement
 */
export async function handleEpisodeDecrement(animeData: AnimeData, container: HTMLDivElement): Promise<void> {
    try {
        const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
        const currentEpisode = parseInt(episodeInput.value, 10);
        const newEpisode = currentEpisode - 1;

        if (newEpisode < 1) {
            showToast("Minimum episode number is 1", "error");
            return;
        }

        const result = await animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

        if (result.success) {
            episodeInput.value = newEpisode.toString();
            showToast(`Updated to episode ${newEpisode}`, "success");
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error decrementing episode:", error);
        showToast("Error updating episode", "error");
    }
}

/**
 * Handle direct episode input
 */
export async function handleDirectEpisodeInput(animeData: AnimeData, container: HTMLDivElement): Promise<void> {
    try {
        const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
        const newEpisode = parseInt(episodeInput.value, 10);

        // Validate episode number
        if (isNaN(newEpisode) || newEpisode < 1 || newEpisode > 999) {
            showToast("Please enter a valid episode number (1-999)", "error");
            // Reset to previous value by refreshing
            await refreshAnimeControls(animeData.animeId);
            return;
        }

        const result = await animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

        if (result.success) {
            showToast(`Updated to episode ${newEpisode}`, "success");
        } else {
            showToast(result.message, "error");
            // Reset to previous value
            await refreshAnimeControls(animeData.animeId);
        }
    } catch (error) {
        console.error("Error updating episode:", error);
        showToast("Error updating episode", "error");
    }
}

/**
 * Handle Stop Watching button click
 */
export async function handleStopWatchingClick(animeData: AnimeData): Promise<void> {
    try {
        const status = await animeService.getAnimeStatus(animeData.animeId);

        // Validate business rules
        if (!canStopWatching(status)) {
            showToast("Anime is not currently being watched", "error");
            return;
        }

        const result = await animeService.stopWatching(animeData.animeId);

        if (result.success) {
            showToast(`Stopped watching "${animeData.animeTitle}"`, "info");
            // Refresh the controls for this anime
            await refreshAnimeControls(animeData.animeId);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error handling stop watching click:", error);
        showToast("Error occurred while stopping watch", "error");
    }
}

/**
 * Handle Remove Plan button click
 */
export async function handleRemovePlanClick(animeData: AnimeData): Promise<void> {
    try {
        const status = await animeService.getAnimeStatus(animeData.animeId);

        // Validate business rules
        if (!canRemoveFromPlan(status)) {
            showToast("Anime is not in plan list", "error");
            return;
        }

        const result = await animeService.removeFromPlanToWatch(animeData.animeId);

        if (result.success) {
            showToast(`Removed "${animeData.animeTitle}" from plan`, "info");
            // Refresh the controls for this anime
            await refreshAnimeControls(animeData.animeId);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error handling remove plan click:", error);
        showToast("Error occurred while removing from plan", "error");
    }
}

/**
 * Refresh anime controls after state change
 */
async function refreshAnimeControls(animeId: string): Promise<void> {
    try {
        // Find anime item in DOM
        const animeItem = document.querySelector(`[data-anime-id="${animeId}"]`)?.closest(SELECTORS.ITEM);
        if (!animeItem) return;

        // Remove existing controls
        const existingControls = animeItem.querySelector(".anime-list-controls");
        if (existingControls) {
            existingControls.remove();
        }

        // Re-add controls with updated state
        await addControlsToItem(animeItem);
    } catch (error) {
        console.error("Error refreshing anime controls:", error);
    }
}

/**
 * Handle Plan button click
 */
export async function handlePlanClick(animeData: AnimeData): Promise<void> {
    try {
        const status = await animeService.getAnimeStatus(animeData.animeId);

        if (status.isPlanned) {
            // Validate business rules for removing from plan
            if (!canRemoveFromPlan(status)) {
                showToast("Cannot remove from plan", "error");
                return;
            }

            // Remove from plan-to-watch list
            const result = await animeService.removeFromPlanToWatch(animeData.animeId);
            if (result.success) {
                showToast(`Removed "${animeData.animeTitle}" from plan`, "info");
                await refreshAnimeControls(animeData.animeId);
            } else {
                showToast(result.message, "error");
            }
        } else {
            // Validate business rules for adding to plan
            if (!canAddToPlan(status)) {
                if (status.isHidden) {
                    showToast("Cannot plan hidden anime", "error");
                } else if (status.isTracked) {
                    showToast("Cannot plan anime that is being watched", "error");
                } else {
                    showToast("Cannot add to plan", "error");
                }
                return;
            }

            // Add to plan-to-watch list
            const result = await animeService.addToPlanToWatch(animeData);
            if (result.success) {
                showToast(`Added "${animeData.animeTitle}" to plan`, "success");
                await refreshAnimeControls(animeData.animeId);
            } else {
                showToast(result.message, "error");
            }
        }
    } catch (error) {
        console.error("Error handling plan click:", error);
        showToast("Error occurred", "error");
    }
}

/**
 * Handle Hide button click
 */
export async function handleHideClick(animeData: AnimeData, button: HTMLButtonElement): Promise<void> {
    try {
        const status = await animeService.getAnimeStatus(animeData.animeId);

        // Validate business rules for hiding
        if (!canHide(status)) {
            if (status.isPlanned) {
                showToast("Cannot hide planned anime", "error");
            } else if (status.isTracked) {
                showToast("Cannot hide anime that is being watched", "error");
            } else {
                showToast("Cannot hide this anime", "error");
            }
            return;
        }

        // Add to hidden list
        const result = await animeService.hideAnime(animeData.animeId);

        if (result.success) {
            // Find the parent anime item and hide it
            const animeItem = button.closest(SELECTORS.ITEM);
            if (animeItem) {
                animeItem.classList.add("anime-hidden");
                // Use CSS transition for smooth hiding
                setTimeout(() => {
                    (animeItem as HTMLElement).style.display = "none";
                }, 300);
            }
            showToast(`Hidden "${animeData.animeTitle}"`, "success");
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error handling hide click:", error);
        showToast("Error occurred", "error");
    }
}

/**
 * Handle Clear Hidden button click
 */
export async function handleClearHiddenClick(): Promise<void> {
    try {
        // Use the optimized clearAllHidden method
        const result = await animeService.clearAllHidden();

        if (result.success) {
            // Show all previously hidden items in the DOM
            const hiddenItems = document.querySelectorAll(".anime-hidden");
            hiddenItems.forEach((item) => {
                item.classList.remove("anime-hidden");
                (item as HTMLElement).style.display = "";
            });

            showToast(result.message, "success");
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        console.error("Error handling clear hidden click:", error);
        showToast("Error occurred", "error");
    }
}

/**
 * Add controls to an anime item
 */
export async function addControlsToItem(element: Element): Promise<void> {
    try {
        // Check if controls already exist
        if (element.querySelector(".anime-list-controls")) {
            return;
        }

        const animeData = extractAnimeData(element);
        if (!animeData) return;

        // Get unified anime status
        const status = await animeService.getAnimeStatus(animeData.animeId);

        // Handle hidden anime - no controls shown, item is hidden
        if (status.isHidden) {
            element.classList.add("anime-hidden");
            (element as HTMLElement).style.display = "none";
            return;
        }

        // Create controls container
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "anime-list-controls";
        controlsContainer.setAttribute("data-testid", "anime-controls");

        // Add state-based controls per business requirements
        if (status.isTracked) {
            // Watching: Combined episode controls with stop button on hover
            const episodeProgress = status.progress;
            if (episodeProgress) {
                const combinedWatchingControls = createCombinedWatchingControls(
                    animeData,
                    episodeProgress.currentEpisode,
                );

                controlsContainer.appendChild(combinedWatchingControls);

                // Add visual indicator for watching state
                controlsContainer.classList.add("watching-state");
            }
        } else if (status.isPlanned) {
            // Planned: Start Watching + Remove Plan (NO HIDE button)
            const startWatchingButton = createStartWatchingButton(animeData);
            const removePlanButton = createRemovePlanButton(animeData);

            controlsContainer.appendChild(startWatchingButton);
            controlsContainer.appendChild(removePlanButton);

            // Add visual indicator for planned state
            controlsContainer.classList.add("planned-state");
        } else {
            // Clean state: Plan + Hide buttons
            const planButton = createPlanButton(animeData);
            const hideButton = createHideButton(animeData);

            controlsContainer.appendChild(planButton);
            controlsContainer.appendChild(hideButton);

            // Add visual indicator for clean state
            controlsContainer.classList.add("clean-state");
        }

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
            flex-direction: column;
            gap: 4px;
            z-index: 10;
        }

        /* State indicators for controls */
        .anime-list-controls.watching-state {
            border-left: 3px solid #10b981; /* Green for watching */
        }

        .anime-list-controls.planned-state {
            border-left: 3px solid #3b82f6; /* Blue for planned */
        }

        .anime-list-controls.clean-state {
            border-left: 3px solid transparent;
        }

        /* Base button styles */
        .anime-list-plan-btn,
        .anime-list-hide-btn,
        .anime-list-start-watching-btn,
        .anime-list-stop-watching-btn,
        .anime-list-remove-plan-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            color: rgba(255, 255, 255, 0.9);
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
        }

        /* Plan button */
        .anime-list-plan-btn:hover {
            border-color: rgba(59, 130, 246, 0.5);
            background: rgba(59, 130, 246, 0.2);
            color: white;
        }

        /* Hide button */
        .anime-list-hide-btn:hover {
            border-color: rgba(239, 68, 68, 0.5);
            background: rgba(239, 68, 68, 0.2);
            color: white;
        }

        /* Start Watching button */
        .anime-list-start-watching-btn {
            background: rgba(16, 185, 129, 0.2);
            border-color: rgba(16, 185, 129, 0.3);
            color: rgb(167, 243, 208);
        }

        .anime-list-start-watching-btn:hover {
            background: rgba(16, 185, 129, 0.3);
            border-color: rgba(16, 185, 129, 0.5);
            color: white;
        }

        /* Stop Watching button */
        .anime-list-stop-watching-btn {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.3);
            color: rgb(252, 165, 165);
        }

        .anime-list-stop-watching-btn:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.5);
            color: white;
        }

        /* Remove Plan button */
        .anime-list-remove-plan-btn {
            background: rgba(251, 146, 60, 0.2);
            border-color: rgba(251, 146, 60, 0.3);
            color: rgb(254, 215, 170);
        }

        .anime-list-remove-plan-btn:hover {
            background: rgba(251, 146, 60, 0.3);
            border-color: rgba(251, 146, 60, 0.5);
            color: white;
        }

        /* Watching Controls */
        .anime-list-watching-controls {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 8px;
            color: rgb(167, 243, 208);
        }

        .anime-list-watching-controls .episode-display {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .anime-list-watching-controls .episode-label {
            font-size: 10px;
            font-weight: 500;
        }

        .anime-list-watching-controls .episode-btn {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s ease;
        }

        .anime-list-watching-controls .episode-btn:hover {
            background: rgba(16, 185, 129, 0.3);
            border-color: rgba(16, 185, 129, 0.5);
        }

        .anime-list-watching-controls .episode-current {
            width: 35px;
            padding: 2px 4px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: white;
            font-size: 10px;
            text-align: center;
        }

        .anime-list-watching-controls .episode-current:focus {
            outline: none;
            border-color: rgba(16, 185, 129, 0.5);
        }

        /* Combined Watching Controls (episode visible, stop on hover) */
        .anime-list-combined-watching-controls {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 6px 8px;
            background: rgba(0, 0, 0, 0.7); /* Strong dark background for contrast */
            border: 1px solid rgba(16, 185, 129, 0.4);
            border-radius: 8px;
            color: rgb(167, 243, 208);
            position: relative;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            width: auto;
        }

        /* On hover, darken background for better contrast */
        .anime-list-combined-watching-controls:hover {
            background: rgba(0, 0, 0, 0.8);
            border-color: rgba(16, 185, 129, 0.6);
        }

        .anime-list-combined-watching-controls .episode-display {
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.3s ease;
        }

        .anime-list-combined-watching-controls .episode-label {
            font-size: 10px;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .anime-list-combined-watching-controls .episode-btn {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.2s ease;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .anime-list-combined-watching-controls .episode-btn:hover {
            background: rgba(16, 185, 129, 0.4);
            border-color: rgba(16, 185, 129, 0.6);
            transform: scale(1.05);
        }

        .anime-list-combined-watching-controls .episode-current {
            width: 35px;
            padding: 2px 4px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            color: white;
            font-size: 10px;
            text-align: center;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .anime-list-combined-watching-controls .episode-current:focus {
            outline: none;
            border-color: rgba(16, 185, 129, 0.6);
            background: rgba(255, 255, 255, 0.2);
        }

        /* Stop button - hidden by default, slides down from above on hover */
        .anime-list-combined-watching-controls .stop-watching-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 3px 8px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 5px;
            color: rgb(252, 165, 165);
            cursor: pointer;
            font-size: 9px;
            font-weight: 500;
            transition: all 0.3s ease;
            white-space: nowrap;
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            margin-top: 0;
        }

        .anime-list-combined-watching-controls .stop-watching-btn .button-icon {
            font-size: 8px;
        }

        .anime-list-combined-watching-controls .stop-watching-btn .button-text {
            font-size: 8px;
        }

        .anime-list-combined-watching-controls .stop-watching-btn:hover {
            background: rgba(239, 68, 68, 0.4);
            border-color: rgba(239, 68, 68, 0.6);
            color: white;
        }

        /* Show stop button sliding down on hover */
        .anime-list-combined-watching-controls:hover .stop-watching-btn {
            max-height: 24px; /* Allow space for button */
            opacity: 1;
            margin-top: 2px;
        }

        /* Toast Notifications */
        .anime-list-toast {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            pointer-events: none;
            max-width: 300px;
            word-wrap: break-word;
        }

        .anime-list-toast-success {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: rgb(167, 243, 208);
        }

        .anime-list-toast-error {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: rgb(252, 165, 165);
        }

        .anime-list-toast-info {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: rgb(147, 197, 253);
        }

        /* Clear Hidden Button */
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

            .anime-list-plan-btn,
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
