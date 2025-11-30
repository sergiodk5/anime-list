import type { AnimeData, AnimeStatus, TileOrder, Folder, FolderOrder } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { AnimeService } from "@/commons/services";
import { StorageAdapter } from "@/commons/adapters/StorageAdapter";

/**
 * Content script for anime website integration
 * Adds Plan and Hide controls to anime cards with glass-morphism styling
 */

/**
 * Send runtime message to notify other contexts of anime state changes
 */
function notifyAnimeStateChange(storageKey: StorageKeys, animeId?: string): void {
    try {
        if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
                type: "ANIME_STATE_CHANGED",
                storageKey,
                animeId,
                timestamp: Date.now(),
            });
            console.log(`[ContentScript] Notified state change for ${storageKey}${animeId ? ` (${animeId})` : ""}`);
        }
    } catch (error) {
        console.warn("[ContentScript] Failed to send runtime message:", error);
    }
}

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
    // Skip toast creation in test environment
    if (typeof window === "undefined" || !window.document || (globalThis as any).vitest) {
        return;
    }

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
            // Notify other contexts of the state change
            notifyAnimeStateChange(StorageKeys.EPISODE_PROGRESS, animeData.animeId);
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
            // Notify other contexts of the episode progress change
            notifyAnimeStateChange(StorageKeys.EPISODE_PROGRESS, animeData.animeId);
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
            // Notify other contexts of the episode progress change
            notifyAnimeStateChange(StorageKeys.EPISODE_PROGRESS, animeData.animeId);
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
            // Notify other contexts of the episode progress change
            notifyAnimeStateChange(StorageKeys.EPISODE_PROGRESS, animeData.animeId);
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
            // Notify other contexts of the state change
            notifyAnimeStateChange(StorageKeys.EPISODE_PROGRESS, animeData.animeId);
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
            // Notify other contexts of the state change
            notifyAnimeStateChange(StorageKeys.PLAN_TO_WATCH, animeData.animeId);
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
                // Notify other contexts of the state change
                notifyAnimeStateChange(StorageKeys.PLAN_TO_WATCH, animeData.animeId);
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
                // Notify other contexts of the state change
                notifyAnimeStateChange(StorageKeys.PLAN_TO_WATCH, animeData.animeId);
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
            // Notify other contexts of the state change
            notifyAnimeStateChange(StorageKeys.HIDDEN_ANIME, animeData.animeId);
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

        if (result?.success) {
            // Show all previously hidden items in the DOM
            const hiddenItems = document.querySelectorAll(".anime-hidden");
            hiddenItems.forEach((item) => {
                item.classList.remove("anime-hidden");
                (item as HTMLElement).style.display = "";
            });

            showToast(result.message || "Cleared hidden anime", "success");
            // Notify other contexts of the state change
            notifyAnimeStateChange(StorageKeys.HIDDEN_ANIME);
        } else {
            showToast(result?.message || "Failed to clear hidden anime", "error");
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
                // Handle added nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;

                        // Check if the added node is an anime item
                        if (element.matches(SELECTORS.ITEM)) {
                            addControlsToItem(element);
                            // Make draggable if drag mode is active
                            if (dragModeEnabled) {
                                makeTileDraggable(element as HTMLElement);
                            }
                        }

                        // Check if the added node contains anime items
                        const items = element.querySelectorAll?.(SELECTORS.ITEM);
                        if (items) {
                            items.forEach((item) => {
                                addControlsToItem(item);
                                // Make draggable if drag mode is active
                                if (dragModeEnabled) {
                                    makeTileDraggable(item as HTMLElement);
                                }
                            });
                        }
                    }
                });

                // Handle removed nodes - clean up event listeners to prevent memory leaks
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // nodeType 1 = Element
                        const element = node as Element;

                        // Clean up if the removed node is an anime item
                        if (element.matches?.(SELECTORS.ITEM)) {
                            removeTileDraggable(element as HTMLElement);
                        }

                        // Clean up any anime items within the removed node
                        const items = element.querySelectorAll?.(SELECTORS.ITEM);
                        if (items) {
                            items.forEach((item) => {
                                removeTileDraggable(item as HTMLElement);
                            });
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

        /* Drag-and-Drop Toolbar */
        .anime-list-drag-toolbar {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 10000 !important;
            display: flex !important;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.9) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        .drag-mode-toggle,
        .drag-reset-order {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .drag-mode-toggle:hover,
        .drag-reset-order:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .drag-mode-toggle.active {
            background: rgba(139, 92, 246, 0.3);
            border-color: rgba(139, 92, 246, 0.5);
            color: white;
        }

        .drag-reset-order {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.3);
            color: rgb(252, 165, 165);
        }

        .drag-reset-order:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.5);
            color: white;
        }

        .drag-mode-toggle:focus,
        .drag-mode-toggle:focus-visible,
        .drag-reset-order:focus,
        .drag-reset-order:focus-visible {
            outline: 2px solid rgba(139, 92, 246, 0.8);
            outline-offset: 2px;
        }

        /* Draggable tile styles */
        .flw-item[draggable="true"] {
            cursor: grab;
            outline: 2px dashed rgba(139, 92, 246, 0.5);
            outline-offset: -2px;
            transition: outline 0.2s ease, outline-offset 0.2s ease, transform 0.2s ease, background 0.2s ease;
        }

        .flw-item[draggable="true"]:active {
            cursor: grabbing;
        }

        .flw-item.drag-over {
            outline: 2px solid rgba(139, 92, 246, 0.8);
            outline-offset: -2px;
            transform: scale(1.02);
            background: rgba(139, 92, 246, 0.1);
        }

        .flw-item.dragging {
            opacity: 0.5;
            transform: scale(0.98);
        }

        /* Keyboard selection state */
        .flw-item.keyboard-selected {
            outline: 3px solid rgba(59, 130, 246, 0.8) !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        }

        .flw-item[draggable="true"]:focus {
            outline: 2px solid rgba(59, 130, 246, 0.6);
            outline-offset: 2px;
        }

        /* Responsive adjustments for drag toolbar */
        @media (max-width: 768px) {
            .anime-list-drag-toolbar {
                bottom: 10px;
                right: 10px;
                padding: 6px 10px;
            }

            .drag-mode-toggle,
            .drag-reset-order {
                padding: 6px 10px;
                font-size: 11px;
            }
        }

        /* ========================================
           FOLDER STYLES
           ======================================== */

        /* Folder container - full width row */
        .anime-folder {
            position: relative;
            border-radius: 12px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            min-height: 180px;
            transition: all 0.2s ease;
            display: block;
            width: 100%;
            box-sizing: border-box;
            margin: 8px 0;
        }

        .anime-folder.drag-over {
            background: rgba(139, 92, 246, 0.15);
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }

        .anime-folder.dragging {
            opacity: 0.5;
            transform: scale(0.98);
        }

        .anime-folder[draggable="true"] {
            cursor: grab;
            outline: 2px dashed rgba(139, 92, 246, 0.5);
            outline-offset: -2px;
        }

        .anime-folder[draggable="true"]:active {
            cursor: grabbing;
        }

        /* Folder header with name tab effect */
        .anime-folder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            margin: -8px -8px 8px -8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px 8px 0 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .anime-folder-name-input {
            background: transparent;
            border: none;
            color: white;
            font-weight: 600;
            font-size: 14px;
            outline: none;
            flex: 1;
            min-width: 0;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s ease;
        }

        .anime-folder-name-input:focus {
            background: rgba(255, 255, 255, 0.1);
        }

        .anime-folder-name-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        /* Folder action buttons */
        .anime-folder-actions {
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .anime-folder:hover .anime-folder-actions {
            opacity: 1;
        }

        .folder-color-btn,
        .folder-delete-btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .folder-color-btn:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
        }

        .folder-delete-btn:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.5);
        }

        /* Folder content grid - exactly 6 columns to match host website */
        .anime-folder-content {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 24px 16px;
            min-height: 100px;
            padding: 8px 0;
        }

        /* Ensure tiles inside folders display correctly */
        .anime-folder-content .flw-item {
            width: 100% !important;
            display: block !important;
            min-width: 0;
            max-width: 100%;
            margin: 0 !important;
        }

        .anime-folder-content.empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Empty folder placeholder */
        .folder-empty-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            grid-column: 1 / -1;
            min-height: 80px;
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 8px;
        }

        /* Color picker */
        .folder-color-picker {
            display: flex;
            gap: 6px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .folder-color-picker .color-option {
            width: 28px;
            height: 28px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .folder-color-picker .color-option:hover {
            transform: scale(1.15);
            border-color: white;
        }

        /* Create folder button in toolbar */
        .create-folder-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            background: rgba(59, 130, 246, 0.2);
            color: rgb(147, 197, 253);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .create-folder-btn:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
            color: white;
        }

        /* Responsive adjustments for folders */
        @media (max-width: 768px) {
            .anime-folder {
                min-height: 150px;
            }

            .anime-folder-content {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 6px;
            }

            .anime-folder-name-input {
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

        // Initialize drag-and-drop functionality
        await initializeDragAndDrop();
    } catch (error) {
        console.error("Error initializing AnimeList content script:", error);
    }
}

// =============================================================================
// SINGLE ANIME PAGE FUNCTIONALITY (PHASE 0)
// =============================================================================

/**
 * Single page controller for watch pages with anime info modal
 */
// Single Page Modal state - module-level variables for state management
/**
 * Single page modal functions and variables
 */
export let singlePageModalElement: HTMLElement | null = null;
let singlePageAnimeService: AnimeService | null = null;

/**
 * Reset the single page anime service for testing
 */
export function resetSinglePageAnimeService(): void {
    singlePageAnimeService = null;
}

/**
 * Get or create the single page anime service instance
 */
function getSinglePageAnimeService(): AnimeService {
    if (!singlePageAnimeService) {
        singlePageAnimeService = new AnimeService();
    }
    return singlePageAnimeService;
}

/**
 * Check if current page is a watch page
 */
export function isWatchPage(): boolean {
    return window.location.href.includes("/watch/");
}

/**
 * Extract anime data from watch page
 */
export function extractSinglePageAnimeData(): AnimeData | null {
    try {
        const url = window.location.href;
        const urlMatch = url.match(/\/watch\/([^/?]+)/);
        if (!urlMatch) return null;

        const originalSlug = urlMatch[1];

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
            url,
            originalSlug,
            extractionStrategy: numericIdMatch ? "numeric-suffix" : "full-slug",
            titleSelectorUsed: titleSelectors.find((sel) => document.querySelector(sel)?.textContent?.trim()) || "none",
        };

        console.log("Extracted anime data from watch page:", animeData);
        return animeData;
    } catch (error) {
        console.error("Error extracting anime data:", error);
        return null;
    }
}

/**
 * Create the floating "Anime Info" button
 */
export function createSinglePageInfoButton(animeData: AnimeData): void {
    // Remove existing button
    const existingButton = document.getElementById("anime-list-info-button");
    if (existingButton) {
        existingButton.remove();
    }

    // Create button
    const button = document.createElement("button");
    button.id = "anime-list-info-button";
    button.textContent = "Anime Info";

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
        #anime-list-info-button {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            padding: 12px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9));
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.2s ease;
        }
        #anime-list-info-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
    `;

    if (!document.querySelector("#anime-list-button-styles")) {
        style.id = "anime-list-button-styles";
        document.head.appendChild(style);
    }

    button.addEventListener("click", () => openSinglePageModal(animeData));
    document.body.appendChild(button);
}

/**
 * Open the anime info modal
 */
async function openSinglePageModal(animeData: AnimeData): Promise<void> {
    try {
        // Try to get status with the extracted ID first
        let status = await getSinglePageAnimeService().getAnimeStatus(animeData.animeId);

        // If not found and we used numeric extraction, try with the full slug as backup
        const debug = (animeData as any).debugInfo || {};
        if (
            !status.isTracked &&
            !status.isPlanned &&
            !status.isHidden &&
            debug.extractionStrategy === "numeric-suffix" &&
            debug.originalSlug
        ) {
            const alternativeStatus = await getSinglePageAnimeService().getAnimeStatus(debug.originalSlug);
            if (alternativeStatus.isTracked || alternativeStatus.isPlanned || alternativeStatus.isHidden) {
                status = alternativeStatus;
                // Update the anime data to use the working ID
                animeData.animeId = debug.originalSlug;
                debug.usedFallbackId = true;
            }
        }

        // Debug logging
        console.log("Single Page Modal Debug:");
        console.log("Anime Data:", animeData);
        console.log("Anime Status:", status);
        console.log("Is Tracked:", status.isTracked);
        console.log("Is Planned:", status.isPlanned);
        console.log("Is Hidden:", status.isHidden);
        console.log("Progress:", status.progress);

        showSinglePageModal(animeData, status);
    } catch (error) {
        console.error("Error opening modal:", error);
        showToast("Error loading anime information", "error");
    }
}

/**
 * Show the modal
 */
export function showSinglePageModal(animeData: AnimeData, status: AnimeStatus): void {
    if (singlePageModalElement) {
        closeSinglePageModal();
    }

    // Create modal overlay
    singlePageModalElement = document.createElement("div");
    singlePageModalElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        min-width: 400px;
        max-width: 500px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Add title
    const title = document.createElement("h2");
    title.textContent = animeData.animeTitle;
    title.style.cssText = "margin: 0 0 1rem 0; font-size: 1.5rem;";

    // Add status
    const statusText = document.createElement("p");
    statusText.textContent = getSinglePageStatusText(status);
    statusText.style.cssText = "margin: 0 0 1.5rem 0; opacity: 0.8;";

    // Add actions
    const actions = getSinglePageModalActions(status);
    const actionsContainer = document.createElement("div");
    actionsContainer.style.cssText = "margin-bottom: 1.5rem;";

    actions.forEach((action) => {
        if (action.type === "episodeControls") {
            // Create episode controls instead of a button
            const episodeControlsContainer = document.createElement("div");
            episodeControlsContainer.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 0.75rem;
                padding: 12px 16px;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 8px;
                color: rgb(167, 243, 208);
            `;

            const currentEpisode = status.progress?.currentEpisode || 1;

            episodeControlsContainer.innerHTML = `
                <span style="font-size: 14px; font-weight: 500;">Episode:</span>
                <button class="modal-episode-btn modal-episode-decrement" style="
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                ">−</button>
                <input type="number" class="modal-episode-current" min="1" max="999" value="${currentEpisode}" style="
                    width: 60px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-size: 14px;
                    text-align: center;
                    outline: none;
                ">
                <button class="modal-episode-btn modal-episode-increment" style="
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                ">+</button>
            `;

            // Add event listeners
            const decrementBtn = episodeControlsContainer.querySelector(
                ".modal-episode-decrement",
            ) as HTMLButtonElement;
            const incrementBtn = episodeControlsContainer.querySelector(
                ".modal-episode-increment",
            ) as HTMLButtonElement;
            const episodeInput = episodeControlsContainer.querySelector(".modal-episode-current") as HTMLInputElement;

            decrementBtn.addEventListener("click", async () => {
                const current = parseInt(episodeInput.value, 10);
                const newEpisode = Math.max(1, current - 1);
                if (newEpisode !== current) {
                    episodeInput.value = newEpisode.toString();
                    await updateSinglePageEpisode(animeData.animeId, newEpisode);
                }
            });

            incrementBtn.addEventListener("click", async () => {
                const current = parseInt(episodeInput.value, 10);
                const newEpisode = Math.min(999, current + 1);
                if (newEpisode !== current) {
                    episodeInput.value = newEpisode.toString();
                    await updateSinglePageEpisode(animeData.animeId, newEpisode);
                }
            });

            episodeInput.addEventListener("change", async () => {
                const newEpisode = parseInt(episodeInput.value, 10);
                if (!isNaN(newEpisode) && newEpisode >= 1 && newEpisode <= 999) {
                    await updateSinglePageEpisode(animeData.animeId, newEpisode);
                } else {
                    episodeInput.value = (status.progress?.currentEpisode || 1).toString();
                }
            });

            // Add hover effects
            [decrementBtn, incrementBtn].forEach((btn) => {
                btn.addEventListener("mouseenter", () => {
                    btn.style.background = "rgba(16, 185, 129, 0.3)";
                    btn.style.borderColor = "rgba(16, 185, 129, 0.5)";
                });
                btn.addEventListener("mouseleave", () => {
                    btn.style.background = "rgba(255, 255, 255, 0.1)";
                    btn.style.borderColor = "rgba(255, 255, 255, 0.3)";
                });
            });

            actionsContainer.appendChild(episodeControlsContainer);
        } else {
            // Create regular button
            const button = document.createElement("button");
            button.textContent = action.label;
            button.style.cssText = `
                display: block;
                width: 100%;
                margin-bottom: 0.75rem;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                ${getSinglePageButtonStyles(action.style)}
            `;

            button.addEventListener("click", () => {
                handleSinglePageAction(action.type, animeData);
            });

            actionsContainer.appendChild(button);
        }
    });

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.cssText = `
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        cursor: pointer;
    `;
    closeButton.addEventListener("click", () => closeSinglePageModal());

    // Assemble modal
    modalContent.appendChild(title);
    modalContent.appendChild(statusText);
    modalContent.appendChild(actionsContainer);
    modalContent.appendChild(closeButton);
    singlePageModalElement.appendChild(modalContent);

    // Event handlers
    singlePageModalElement.addEventListener("click", (e) => {
        if (e.target === singlePageModalElement) {
            closeSinglePageModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeSinglePageModal();
        }
    });

    // Show modal
    document.body.appendChild(singlePageModalElement);
    setTimeout(() => {
        if (singlePageModalElement) {
            singlePageModalElement.style.opacity = "1";
        }
    }, 10);
}

/**
 * Get status text for modal display
 */
export function getSinglePageStatusText(status: AnimeStatus): string {
    if (status.isHidden) return "Hidden from lists";
    if (status.isTracked && status.progress) {
        return `Currently watching - Episode ${status.progress.currentEpisode}`;
    }
    if (status.isTracked) return "Currently watching";
    if (status.isPlanned) return "Planned to watch";
    return "Not tracked";
}

/**
 * Get modal actions based on anime status
 */
export function getSinglePageModalActions(status: AnimeStatus) {
    if (status.isHidden) {
        return [{ type: "unhide", label: "Remove from Hidden", style: "success" }];
    } else if (status.isPlanned) {
        return [
            { type: "removePlan", label: "Remove from Plan", style: "danger" },
            { type: "startWatching", label: "Start Watching", style: "primary" },
        ];
    } else if (status.isTracked) {
        return [
            { type: "episodeControls", label: "Episode Controls", style: "primary" },
            { type: "stopWatching", label: "Stop Watching", style: "danger" },
        ];
    } else {
        return [
            { type: "addToPlan", label: "Add to Plan", style: "primary" },
            { type: "hide", label: "Hide Anime", style: "warning" },
        ];
    }
}

/**
 * Get button styles based on style type
 */
function getSinglePageButtonStyles(style: string): string {
    switch (style) {
        case "primary":
            return "background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9)); color: white;";
        case "success":
            return "background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9)); color: white;";
        case "danger":
            return "background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9)); color: white;";
        case "warning":
            return "background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9)); color: white;";
        default:
            return "background: rgba(255, 255, 255, 0.1); color: white;";
    }
}

/**
 * Handle modal action clicks
 */
async function handleSinglePageAction(actionType: string, animeData: AnimeData): Promise<void> {
    try {
        switch (actionType) {
            case "addToPlan":
                await getSinglePageAnimeService().addToPlanToWatch(animeData);
                showToast("Added to plan to watch", "success");
                break;
            case "removePlan":
                await getSinglePageAnimeService().removeFromPlanToWatch(animeData.animeId);
                showToast("Removed from plan to watch", "info");
                break;
            case "startWatching":
                await getSinglePageAnimeService().startWatching(animeData, 1);
                showToast("Started watching", "success");
                break;
            case "stopWatching":
                await getSinglePageAnimeService().stopWatching(animeData.animeId);
                showToast("Stopped watching", "info");
                break;
            case "hide":
                await getSinglePageAnimeService().hideAnime(animeData.animeId);
                showToast("Anime hidden", "info");
                break;
            case "unhide":
                await getSinglePageAnimeService().unhideAnime(animeData.animeId);
                showToast("Removed from hidden", "success");
                break;
        }
        closeSinglePageModal();
    } catch (error) {
        console.error(`Error handling action ${actionType}:`, error);
        showToast("An error occurred", "error");
    }
}

/**
 * Update episode progress
 */
export async function updateSinglePageEpisode(animeId: string, newEpisode: number): Promise<boolean> {
    try {
        const result = await getSinglePageAnimeService().updateEpisodeProgress(animeId, newEpisode);
        if (result.success) {
            showToast(`Updated to episode ${newEpisode}`, "success");
            return true;
        } else {
            showToast(result.message || "Error updating episode", "error");
            return false;
        }
    } catch (error) {
        console.error("Error updating episode:", error);
        showToast("Error updating episode", "error");
        return false;
    }
}

/**
 * Close the modal
 */
export function closeSinglePageModal(): void {
    if (!singlePageModalElement) return;

    singlePageModalElement.style.opacity = "0";
    setTimeout(() => {
        if (singlePageModalElement && singlePageModalElement.parentNode) {
            singlePageModalElement.parentNode.removeChild(singlePageModalElement);
            singlePageModalElement = null;
        }
    }, 300);
}

/**
 * Initialize single page functionality
 */
export function initializeSinglePage(): void {
    if (!isWatchPage()) return;

    const animeData = extractSinglePageAnimeData();
    if (animeData) {
        createSinglePageInfoButton(animeData);
    }
}

// =============================================================================
// FOLDER FUNCTIONALITY
// =============================================================================

// Default folder colors for quick selection
const DEFAULT_FOLDER_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#9B59B6"];

/**
 * Load folder order from storage (with migration from old tileOrder)
 */
export async function loadFolderOrder(): Promise<FolderOrder> {
    try {
        const stored = await StorageAdapter.get<FolderOrder>(StorageKeys.FOLDER_ORDER);
        if (stored) return stored;

        // Migrate from existing tileOrder if no folderOrder exists
        const tileOrder = await loadTileOrder();
        return {
            folders: [],
            rootItems: tileOrder?.animeIds || [],
            folderContents: {},
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Error loading folder order:", error);
        return {
            folders: [],
            rootItems: [],
            folderContents: {},
            lastUpdated: new Date().toISOString(),
        };
    }
}

/**
 * Save folder order to storage
 */
export async function saveFolderOrder(folderOrder: FolderOrder): Promise<void> {
    try {
        folderOrder.lastUpdated = new Date().toISOString();
        await StorageAdapter.set(StorageKeys.FOLDER_ORDER, folderOrder);
        console.log("[ContentScript] Saved folder order");
        // Notify other contexts
        notifyAnimeStateChange(StorageKeys.FOLDER_ORDER);
    } catch (error) {
        console.error("Error saving folder order:", error);
    }
}

/**
 * Update folder empty state based on item count
 */
export function updateFolderSpan(folderId: string): void {
    const folder = document.querySelector(`[data-folder-id="${folderId}"]`) as HTMLElement;
    if (!folder) return;

    const itemCount = folder.querySelectorAll(SELECTORS.ITEM).length;

    // Update empty state
    const content = folder.querySelector(".anime-folder-content") as HTMLElement;
    const placeholder = folder.querySelector(".folder-empty-placeholder") as HTMLElement;
    if (placeholder) {
        placeholder.style.display = itemCount === 0 ? "flex" : "none";
    }
    if (content) {
        content.classList.toggle("empty-state", itemCount === 0);
    }
}

/**
 * Create folder DOM element
 */
export function createFolderElement(folder: Folder): HTMLElement {
    const folderEl = document.createElement("div");
    folderEl.className = "anime-folder";
    folderEl.setAttribute("data-folder-id", folder.id);
    folderEl.setAttribute("data-testid", "anime-folder");
    folderEl.setAttribute("role", "region");
    folderEl.setAttribute("aria-label", `Folder: ${escapeHtml(folder.name)}`);
    if (isValidHexColor(folder.borderColor)) {
        folderEl.style.border = `3px solid ${folder.borderColor}`;
    }

    folderEl.innerHTML = `
        <div class="anime-folder-header" data-testid="folder-header" role="toolbar" aria-label="Folder controls">
            <input class="anime-folder-name-input"
                   data-testid="folder-name-input"
                   value="${escapeHtml(folder.name)}"
                   placeholder="Folder name"
                   aria-label="Edit folder name"
                   type="text"
                   maxlength="50" />
            <div class="anime-folder-actions" role="group" aria-label="Folder actions">
                <button class="folder-color-btn"
                        data-testid="folder-color-btn"
                        type="button"
                        title="Change folder color"
                        aria-label="Change folder color"
                        aria-haspopup="true">
                    <span aria-hidden="true">🎨</span>
                </button>
                <button class="folder-delete-btn"
                        data-testid="folder-delete-btn"
                        type="button"
                        title="Delete folder"
                        aria-label="Delete folder">
                    <span aria-hidden="true">✕</span>
                </button>
            </div>
        </div>
        <div class="anime-folder-content"
             data-testid="folder-content"
             role="list"
             aria-label="Folder contents"
             aria-dropeffect="move">
            <div class="folder-empty-placeholder" aria-live="polite">Drop anime here</div>
        </div>
    `;

    // Setup event handlers
    setupFolderEventHandlers(folderEl, folder.id);

    return folderEl;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validate hex color format to prevent CSS injection
 */
function isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Setup event handlers for a folder element
 */
function setupFolderEventHandlers(folderEl: HTMLElement, folderId: string): void {
    const nameInput = folderEl.querySelector(".anime-folder-name-input") as HTMLInputElement;
    const colorBtn = folderEl.querySelector(".folder-color-btn") as HTMLButtonElement;
    const deleteBtn = folderEl.querySelector(".folder-delete-btn") as HTMLButtonElement;
    const content = folderEl.querySelector(".anime-folder-content") as HTMLElement;

    // Rename on blur or enter
    nameInput.addEventListener("blur", async () => {
        await renameFolder(folderId, nameInput.value.trim() || "Untitled");
    });

    nameInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            nameInput.blur();
        }
    });

    // Prevent drag when editing name
    nameInput.addEventListener("mousedown", (e) => e.stopPropagation());
    nameInput.addEventListener("click", (e) => e.stopPropagation());

    // Color picker
    colorBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showColorPicker(folderId, colorBtn);
    });

    // Delete folder
    deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await deleteFolder(folderId);
    });

    // Setup folder content as drop zone
    setupFolderDropZone(content, folderId);
}

/**
 * Setup folder content area as a drop zone for tiles
 */
function setupFolderDropZone(content: HTMLElement, folderId: string): void {
    content.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedElement?.classList.contains("flw-item")) {
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
            content.closest(".anime-folder")?.classList.add("drag-over");
        }
    });

    content.addEventListener("dragleave", (e) => {
        e.stopPropagation();
        const folder = content.closest(".anime-folder");
        const relatedTarget = e.relatedTarget as Node | null;
        if (!relatedTarget || !folder?.contains(relatedTarget)) {
            folder?.classList.remove("drag-over");
        }
    });

    content.addEventListener("drop", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        content.closest(".anime-folder")?.classList.remove("drag-over");

        if (draggedElement?.classList.contains("flw-item")) {
            await handleDropIntoFolder(draggedElement, folderId);
        }
    });
}

/**
 * Show color picker for folder
 */
function showColorPicker(folderId: string, anchorElement: HTMLElement): void {
    // Remove any existing color picker
    document.querySelector(".folder-color-picker")?.remove();

    const picker = document.createElement("div");
    picker.className = "folder-color-picker";
    picker.setAttribute("data-testid", "folder-color-picker");
    picker.setAttribute("role", "listbox");
    picker.setAttribute("aria-label", "Select folder color");

    picker.innerHTML = DEFAULT_FOLDER_COLORS.map(
        (color, index) =>
            `<button class="color-option"
                     data-color="${color}"
                     style="background: ${color};"
                     type="button"
                     role="option"
                     aria-label="Color ${color}"
                     title="Select color ${color}"
                     tabindex="${index === 0 ? "0" : "-1"}"></button>`,
    ).join("");

    // Position near the button
    const rect = anchorElement.getBoundingClientRect();
    picker.style.position = "fixed";
    picker.style.top = `${rect.bottom + 5}px`;
    picker.style.left = `${rect.left}px`;
    picker.style.zIndex = "10002";

    // Handle color selection
    picker.addEventListener("click", async (e) => {
        const target = e.target as HTMLElement;
        const color = target.getAttribute("data-color");
        if (color) {
            await changeFolderColor(folderId, color);
            picker.remove();
        }
    });

    // Close picker when clicking outside
    const closeHandler = (e: MouseEvent) => {
        if (!picker.contains(e.target as Node) && e.target !== anchorElement) {
            picker.remove();
            document.removeEventListener("click", closeHandler);
        }
    };
    setTimeout(() => document.addEventListener("click", closeHandler), 0);

    document.body.appendChild(picker);
}

/**
 * Create a new folder with default values
 */
export async function createFolder(): Promise<Folder> {
    const folder: Folder = {
        id: `folder-${Date.now()}`,
        name: "New Folder",
        borderColor: DEFAULT_FOLDER_COLORS[Math.floor(Math.random() * DEFAULT_FOLDER_COLORS.length)],
        createdAt: new Date().toISOString(),
    };

    const folderOrder = await loadFolderOrder();
    folderOrder.folders.push(folder);
    folderOrder.rootItems.push(`folder:${folder.id}`);
    folderOrder.folderContents[folder.id] = [];
    await saveFolderOrder(folderOrder);

    // Create and insert DOM element
    const folderEl = createFolderElement(folder);
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (container) {
        container.appendChild(folderEl);
        // Make it draggable if drag mode is enabled
        if (dragModeEnabled) {
            makeFolderDraggable(folderEl);
        }
        // Focus the name input for inline editing
        const nameInput = folderEl.querySelector(".anime-folder-name-input") as HTMLInputElement;
        nameInput?.focus();
        nameInput?.select();
    }

    showToast(`Created folder "${folder.name}"`, "success");
    return folder;
}

/**
 * Rename a folder
 */
export async function renameFolder(folderId: string, newName: string): Promise<void> {
    const folderOrder = await loadFolderOrder();
    const folder = folderOrder.folders.find((f) => f.id === folderId);
    if (!folder) return;

    if (folder.name === newName) return; // No change

    folder.name = newName;
    await saveFolderOrder(folderOrder);

    // Update aria-label on folder element
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderEl) {
        folderEl.setAttribute("aria-label", `Folder: ${escapeHtml(newName)}`);
    }

    console.log(`[ContentScript] Renamed folder ${folderId} to "${newName}"`);
}

/**
 * Change folder border color
 */
export async function changeFolderColor(folderId: string, newColor: string): Promise<void> {
    const folderOrder = await loadFolderOrder();
    const folder = folderOrder.folders.find((f) => f.id === folderId);
    if (!folder) return;

    if (!isValidHexColor(newColor)) return;

    folder.borderColor = newColor;
    await saveFolderOrder(folderOrder);

    // Update DOM
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`) as HTMLElement;
    if (folderEl) {
        folderEl.style.border = `3px solid ${newColor}`;
    }

    showToast("Folder color updated", "success");
}

/**
 * Delete a folder and move its items back to root
 */
export async function deleteFolder(folderId: string): Promise<void> {
    const folderOrder = await loadFolderOrder();
    const folderIndex = folderOrder.folders.findIndex((f) => f.id === folderId);
    if (folderIndex === -1) return;

    const folderItems = folderOrder.folderContents[folderId] || [];

    // Remove folder from folders array
    folderOrder.folders.splice(folderIndex, 1);

    // Remove folder from rootItems and insert its items at that position
    const rootIndex = folderOrder.rootItems.indexOf(`folder:${folderId}`);
    if (rootIndex !== -1) {
        folderOrder.rootItems.splice(rootIndex, 1, ...folderItems);
    }

    // Remove folder contents entry
    delete folderOrder.folderContents[folderId];

    await saveFolderOrder(folderOrder);

    // Update DOM: move tiles back to root, then remove folder element
    const container = document.querySelector(SELECTORS.CONTAINER);
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);

    if (folderEl && container) {
        const tiles = folderEl.querySelectorAll(SELECTORS.ITEM);
        tiles.forEach((tile) => {
            container.insertBefore(tile, folderEl);
        });
        folderEl.remove();
    }

    showToast("Folder deleted, items moved to root", "info");
}

/**
 * Handle dropping a tile into a folder
 */
async function handleDropIntoFolder(tile: HTMLElement, folderId: string): Promise<void> {
    const animeData = extractAnimeData(tile);
    if (!animeData) return;

    const folderOrder = await loadFolderOrder();

    // Remove from current location (root or other folder)
    folderOrder.rootItems = folderOrder.rootItems.filter((id) => id !== animeData.animeId);
    for (const [fId, contents] of Object.entries(folderOrder.folderContents)) {
        folderOrder.folderContents[fId] = contents.filter((id) => id !== animeData.animeId);
    }

    // Add to target folder
    if (!folderOrder.folderContents[folderId]) {
        folderOrder.folderContents[folderId] = [];
    }
    folderOrder.folderContents[folderId].push(animeData.animeId);

    await saveFolderOrder(folderOrder);

    // Move DOM element
    const folderContent = document.querySelector(`[data-folder-id="${folderId}"] .anime-folder-content`);
    folderContent?.appendChild(tile);

    updateFolderSpan(folderId);
    showToast("Moved to folder", "success");
}

/**
 * Handle dropping a tile from folder back to root
 */
async function handleDropFromFolderToRoot(tile: HTMLElement, insertBeforeElement: Element | null): Promise<void> {
    const animeData = extractAnimeData(tile);
    if (!animeData) return;

    const folderOrder = await loadFolderOrder();
    let sourceFolderId: string | null = null;

    // Find and remove from current folder
    for (const [fId, contents] of Object.entries(folderOrder.folderContents)) {
        const index = contents.indexOf(animeData.animeId);
        if (index !== -1) {
            sourceFolderId = fId;
            folderOrder.folderContents[fId].splice(index, 1);
            break;
        }
    }

    // Add to root items at appropriate position
    if (insertBeforeElement) {
        const insertId =
            insertBeforeElement.getAttribute("data-folder-id") || extractAnimeData(insertBeforeElement)?.animeId;
        if (insertId) {
            const targetId = insertBeforeElement.classList.contains("anime-folder") ? `folder:${insertId}` : insertId;
            const insertIndex = folderOrder.rootItems.indexOf(targetId);
            if (insertIndex !== -1) {
                folderOrder.rootItems.splice(insertIndex, 0, animeData.animeId);
            } else {
                folderOrder.rootItems.push(animeData.animeId);
            }
        } else {
            folderOrder.rootItems.push(animeData.animeId);
        }
    } else {
        folderOrder.rootItems.push(animeData.animeId);
    }

    await saveFolderOrder(folderOrder);

    // Move DOM element
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (container) {
        if (insertBeforeElement) {
            container.insertBefore(tile, insertBeforeElement);
        } else {
            container.appendChild(tile);
        }
    }

    // Update source folder span
    if (sourceFolderId) {
        updateFolderSpan(sourceFolderId);
    }

    showToast("Moved to root", "success");
}

/**
 * Make a folder element draggable
 */
export function makeFolderDraggable(folderEl: HTMLElement): void {
    if (folderEl.getAttribute("draggable") === "true") return;

    folderEl.setAttribute("draggable", "true");
    folderEl.setAttribute("tabindex", "0");
    folderEl.setAttribute("role", "group");

    folderEl.addEventListener("dragstart", handleFolderDragStart);
    folderEl.addEventListener("dragover", handleDragOver);
    folderEl.addEventListener("dragenter", handleFolderDragEnter);
    folderEl.addEventListener("dragleave", handleDragLeave);
    folderEl.addEventListener("drop", handleDrop);
    folderEl.addEventListener("dragend", handleDragEnd);
}

/**
 * Remove draggable from folder
 */
export function removeFolderDraggable(folderEl: HTMLElement): void {
    folderEl.removeAttribute("draggable");
    folderEl.removeAttribute("tabindex");
    folderEl.removeAttribute("role");
    folderEl.classList.remove("drag-over", "dragging");

    folderEl.removeEventListener("dragstart", handleFolderDragStart);
    folderEl.removeEventListener("dragover", handleDragOver);
    folderEl.removeEventListener("dragenter", handleFolderDragEnter);
    folderEl.removeEventListener("dragleave", handleDragLeave);
    folderEl.removeEventListener("drop", handleDrop);
    folderEl.removeEventListener("dragend", handleDragEnd);
}

/**
 * Container drop zone handler for dragover
 */
function handleContainerDragOver(e: DragEvent): void {
    // Only handle if dragging a tile from a folder
    if (!draggedElement?.classList.contains("flw-item")) return;
    const fromFolder = draggedElement.closest(".anime-folder-content");
    if (!fromFolder) return;

    // Check if dropping directly on container (not on a tile or folder)
    const target = e.target as HTMLElement;
    if (target.closest(".flw-item") || target.closest(".anime-folder")) return;

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
}

/**
 * Container drop zone handler for drop - removes item from folder to root
 */
async function handleContainerDrop(e: DragEvent): Promise<void> {
    // Only handle if dragging a tile from a folder
    if (!draggedElement?.classList.contains("flw-item")) return;
    const fromFolder = draggedElement.closest(".anime-folder-content");
    const sourceFolderId = fromFolder?.closest(".anime-folder")?.getAttribute("data-folder-id");
    if (!fromFolder || !sourceFolderId) return;

    // Check if dropping directly on container (not on a tile or folder)
    const target = e.target as HTMLElement;
    if (target.closest(".flw-item") || target.closest(".anime-folder")) return;

    e.preventDefault();
    e.stopPropagation();

    // Move tile from folder to root
    await handleDropFromFolderToRoot(draggedElement, null);
}

/**
 * Setup container as drop zone for removing items from folders
 */
function setupContainerDropZone(container: HTMLElement): void {
    container.addEventListener("dragover", handleContainerDragOver);
    container.addEventListener("drop", handleContainerDrop);
}

/**
 * Remove container drop zone handlers
 */
function removeContainerDropZone(container: HTMLElement): void {
    container.removeEventListener("dragover", handleContainerDragOver);
    container.removeEventListener("drop", handleContainerDrop);
}

/**
 * Handle folder drag start
 */
function handleFolderDragStart(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;

    // Don't start drag if clicking on input or buttons
    const eventTarget = e.target as HTMLElement;
    if (
        eventTarget.classList.contains("anime-folder-name-input") ||
        eventTarget.closest(".anime-folder-actions") ||
        eventTarget.closest("button")
    ) {
        e.preventDefault();
        return;
    }

    draggedElement = target;
    target.classList.add("dragging");

    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "folder");
    }

    e.stopPropagation();
}

/**
 * Handle folder drag enter
 */
function handleFolderDragEnter(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;

    // Only show drag-over for folder reordering, not when dragging tiles into folder
    if (draggedElement?.classList.contains("anime-folder") && target !== draggedElement) {
        target.classList.add("drag-over");
    }
}

/**
 * Restore folder order from storage
 */
export async function restoreFolderOrder(): Promise<void> {
    const folderOrder = await loadFolderOrder();

    // If no folders exist and no custom root order, fall back to tile order
    if (folderOrder.folders.length === 0 && folderOrder.rootItems.length === 0) {
        await restoreTileOrder();
        return;
    }

    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    // Build map of anime ID to tile element
    const tileMap = new Map<string, Element>();
    const items = container.querySelectorAll(SELECTORS.ITEM);
    items.forEach((item) => {
        const animeData = extractAnimeData(item);
        if (animeData) {
            tileMap.set(animeData.animeId, item);
        }
    });

    // Create folder elements and populate them
    const folderElements = new Map<string, HTMLElement>();
    for (const folder of folderOrder.folders) {
        const folderEl = createFolderElement(folder);
        folderElements.set(folder.id, folderEl);

        // Populate folder with its tiles
        const folderContent = folderEl.querySelector(".anime-folder-content");
        const folderItems = folderOrder.folderContents[folder.id] || [];
        for (const animeId of folderItems) {
            const tile = tileMap.get(animeId);
            if (tile) {
                folderContent?.appendChild(tile);
                tileMap.delete(animeId);
            }
        }
    }

    // Rebuild root level in order
    for (const itemId of folderOrder.rootItems) {
        if (itemId.startsWith("folder:")) {
            const folderId = itemId.replace("folder:", "");
            const folderEl = folderElements.get(folderId);
            if (folderEl) container.appendChild(folderEl);
        } else {
            const tile = tileMap.get(itemId);
            if (tile) {
                container.appendChild(tile);
                tileMap.delete(itemId);
            }
        }
    }

    // Append any remaining tiles (new tiles not in saved order)
    tileMap.forEach((tile) => container.appendChild(tile));

    // Update folder spans AFTER all folders are in the DOM
    for (const folder of folderOrder.folders) {
        updateFolderSpan(folder.id);
    }

    console.log(
        "[ContentScript] Restored folder order:",
        folderOrder.folders.length,
        "folders,",
        folderOrder.rootItems.length,
        "root items",
    );
}

// =============================================================================
// DRAG-AND-DROP TILE REORDERING
// =============================================================================

// Drag-and-drop state variables
let dragModeEnabled = false;
let draggedElement: HTMLElement | null = null;
let dragToolbar: HTMLElement | null = null;
let saveOrderTimeout: ReturnType<typeof setTimeout> | null = null;
let saveFolderOrderTimeout: ReturnType<typeof setTimeout> | null = null;
let saveRootOrderTimeout: ReturnType<typeof setTimeout> | null = null;
let keyboardSelectedElement: HTMLElement | null = null;

/**
 * Load tile order from storage
 */
export async function loadTileOrder(): Promise<TileOrder | null> {
    try {
        return await StorageAdapter.get<TileOrder>(StorageKeys.TILE_ORDER);
    } catch (error) {
        console.error("Error loading tile order:", error);
        return null;
    }
}

/**
 * Save tile order to storage
 * Note: Caller is responsible for debouncing to avoid excessive writes (see handleDrop)
 */
export async function saveTileOrder(animeIds: string[]): Promise<void> {
    try {
        const tileOrder: TileOrder = {
            animeIds,
            lastUpdated: new Date().toISOString(),
        };
        await StorageAdapter.set(StorageKeys.TILE_ORDER, tileOrder);
        console.log("[ContentScript] Saved tile order:", animeIds.length, "items");
    } catch (error) {
        console.error("Error saving tile order:", error);
    }
}

/**
 * Clear tile order from storage
 */
export async function clearTileOrder(): Promise<void> {
    try {
        await StorageAdapter.remove(StorageKeys.TILE_ORDER);
        console.log("[ContentScript] Cleared tile order");
    } catch (error) {
        console.error("Error clearing tile order:", error);
    }
}

/**
 * Get current tile order from DOM
 */
export function getCurrentTileOrder(): string[] {
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return [];

    const items = container.querySelectorAll(SELECTORS.ITEM);
    const animeIds: string[] = [];

    items.forEach((item) => {
        const animeData = extractAnimeData(item);
        if (animeData) {
            animeIds.push(animeData.animeId);
        }
    });

    return animeIds;
}

/**
 * Create the drag toolbar element
 */
export function createDragToolbar(): HTMLDivElement {
    const toolbar = document.createElement("div");
    toolbar.className = "anime-list-drag-toolbar";
    toolbar.setAttribute("data-testid", "drag-toolbar");

    toolbar.innerHTML = `
        <button class="drag-mode-toggle" data-testid="drag-mode-toggle" aria-label="Toggle tile reorder mode">
            <span class="button-icon" aria-hidden="true">↕️</span>
            <span class="button-text">Reorder</span>
        </button>
        <button class="create-folder-btn" data-testid="create-folder-btn" style="display: none;" aria-label="Create new folder">
            <span class="button-icon" aria-hidden="true">📁</span>
            <span class="button-text">New Folder</span>
        </button>
        <button class="drag-reset-order" data-testid="drag-reset-order" style="display: none;" aria-label="Reset tile order to default">
            <span class="button-icon" aria-hidden="true">🔄</span>
            <span class="button-text">Reset</span>
        </button>
    `;

    // Toggle button handler
    const toggleBtn = toolbar.querySelector(".drag-mode-toggle") as HTMLButtonElement;
    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDragMode();
    });

    // Create folder button handler
    const createFolderBtn = toolbar.querySelector(".create-folder-btn") as HTMLButtonElement;
    createFolderBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await createFolder();
    });

    // Reset button handler
    const resetBtn = toolbar.querySelector(".drag-reset-order") as HTMLButtonElement;
    resetBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await resetTileOrder();
    });

    return toolbar;
}

/**
 * Insert drag toolbar into the page
 */
export function insertDragToolbar(): void {
    // Only insert if container exists and toolbar doesn't exist
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    if (document.querySelector(".anime-list-drag-toolbar")) return;

    dragToolbar = createDragToolbar();
    document.body.appendChild(dragToolbar);
}

/**
 * Toggle drag mode on/off
 */
export function toggleDragMode(): void {
    if (dragModeEnabled) {
        disableDragMode();
    } else {
        enableDragMode();
    }
}

/**
 * Handle keyboard navigation for tile reordering
 */
function handleTileKeydown(e: KeyboardEvent): void {
    if (!dragModeEnabled) return;

    const target = e.currentTarget as HTMLElement;
    const container = target.parentElement;
    if (!container) return;

    const items = Array.from(container.querySelectorAll(SELECTORS.ITEM)) as HTMLElement[];
    const currentIndex = items.indexOf(target);

    // Space or Enter to select/deselect for moving
    if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (keyboardSelectedElement === target) {
            // Deselect
            keyboardSelectedElement.classList.remove("keyboard-selected");
            keyboardSelectedElement = null;
            showToast("Tile deselected", "info");
        } else if (keyboardSelectedElement) {
            // Move selected element to current position
            const selectedIndex = items.indexOf(keyboardSelectedElement);
            if (selectedIndex !== -1 && selectedIndex !== currentIndex) {
                if (currentIndex < selectedIndex) {
                    container.insertBefore(keyboardSelectedElement, target);
                } else {
                    container.insertBefore(keyboardSelectedElement, target.nextSibling);
                }
                // Save order
                debouncedSaveOrder();
                showToast("Tile moved", "success");
            }
            keyboardSelectedElement.classList.remove("keyboard-selected");
            keyboardSelectedElement = null;
        } else {
            // Select current element
            keyboardSelectedElement = target;
            target.classList.add("keyboard-selected");
            showToast("Tile selected - use arrow keys and Enter to move", "info");
        }
        return;
    }

    // Arrow keys to navigate or move
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (keyboardSelectedElement === target && currentIndex > 0) {
            // Move selected element up
            container.insertBefore(target, items[currentIndex - 1]);
            target.focus();
            debouncedSaveOrder();
        } else if (currentIndex > 0) {
            // Navigate to previous item
            items[currentIndex - 1].focus();
        }
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (keyboardSelectedElement === target && currentIndex < items.length - 1) {
            // Move selected element down
            container.insertBefore(target, items[currentIndex + 2] || null);
            target.focus();
            debouncedSaveOrder();
        } else if (currentIndex < items.length - 1) {
            // Navigate to next item
            items[currentIndex + 1].focus();
        }
    } else if (e.key === "Escape" && keyboardSelectedElement) {
        // Cancel selection
        keyboardSelectedElement.classList.remove("keyboard-selected");
        keyboardSelectedElement = null;
        showToast("Selection cancelled", "info");
    }
}

/**
 * Debounced save order helper
 */
function debouncedSaveOrder(): void {
    if (saveOrderTimeout) {
        clearTimeout(saveOrderTimeout);
    }
    saveOrderTimeout = setTimeout(async () => {
        const newOrder = getCurrentTileOrder();
        await saveTileOrder(newOrder);
    }, 500);
}

/**
 * Make a single tile draggable
 */
export function makeTileDraggable(element: HTMLElement): void {
    // Check if already draggable to avoid duplicate listeners
    if (element.getAttribute("draggable") === "true") return;

    element.setAttribute("draggable", "true");
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "listitem");
    element.addEventListener("dragstart", handleDragStart);
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);
    element.addEventListener("drop", handleDrop);
    element.addEventListener("dragend", handleDragEnd);
    element.addEventListener("keydown", handleTileKeydown);
}

/**
 * Remove draggable from a single tile
 */
export function removeTileDraggable(element: HTMLElement): void {
    element.removeAttribute("draggable");
    element.removeAttribute("tabindex");
    element.removeAttribute("role");
    element.classList.remove("drag-over", "dragging", "keyboard-selected");
    element.removeEventListener("dragstart", handleDragStart);
    element.removeEventListener("dragover", handleDragOver);
    element.removeEventListener("dragenter", handleDragEnter);
    element.removeEventListener("dragleave", handleDragLeave);
    element.removeEventListener("drop", handleDrop);
    element.removeEventListener("dragend", handleDragEnd);
    element.removeEventListener("keydown", handleTileKeydown);

    // Clear keyboard selection if this element was selected
    if (keyboardSelectedElement === element) {
        keyboardSelectedElement = null;
    }
}

/**
 * Enable drag mode
 */
export function enableDragMode(): void {
    dragModeEnabled = true;

    const container = document.querySelector(SELECTORS.CONTAINER) as HTMLElement;
    if (!container) return;

    // Make tiles draggable
    const items = container.querySelectorAll(SELECTORS.ITEM);
    items.forEach((item) => {
        makeTileDraggable(item as HTMLElement);
    });

    // Make folders draggable
    const folders = container.querySelectorAll(".anime-folder");
    folders.forEach((folder) => {
        makeFolderDraggable(folder as HTMLElement);
    });

    // Setup container as drop zone for removing items from folders
    setupContainerDropZone(container);

    // Update toolbar UI
    if (dragToolbar) {
        const toggleBtn = dragToolbar.querySelector(".drag-mode-toggle") as HTMLButtonElement;
        const createFolderBtn = dragToolbar.querySelector(".create-folder-btn") as HTMLButtonElement;
        const resetBtn = dragToolbar.querySelector(".drag-reset-order") as HTMLButtonElement;

        toggleBtn.classList.add("active");
        const enableButtonText = toggleBtn.querySelector(".button-text");
        if (enableButtonText) enableButtonText.textContent = "Done";
        createFolderBtn.style.display = "flex";
        resetBtn.style.display = "flex";
    }

    showToast("Reorder mode: drag tiles or use Tab + Enter + Arrow keys", "info");
}

/**
 * Disable drag mode
 */
export function disableDragMode(): void {
    dragModeEnabled = false;

    // Clear any pending save operations
    if (saveOrderTimeout) {
        clearTimeout(saveOrderTimeout);
        saveOrderTimeout = null;
    }

    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    // Remove draggable from tiles
    const items = container.querySelectorAll(SELECTORS.ITEM);
    items.forEach((item) => {
        removeTileDraggable(item as HTMLElement);
    });

    // Remove draggable from folders
    const folders = container.querySelectorAll(".anime-folder");
    folders.forEach((folder) => {
        removeFolderDraggable(folder as HTMLElement);
    });

    // Remove container drop zone
    removeContainerDropZone(container as HTMLElement);

    // Update toolbar UI
    if (dragToolbar) {
        const toggleBtn = dragToolbar.querySelector(".drag-mode-toggle") as HTMLButtonElement;
        const createFolderBtn = dragToolbar.querySelector(".create-folder-btn") as HTMLButtonElement;
        const resetBtn = dragToolbar.querySelector(".drag-reset-order") as HTMLButtonElement;

        toggleBtn.classList.remove("active");
        const disableButtonText = toggleBtn.querySelector(".button-text");
        if (disableButtonText) disableButtonText.textContent = "Reorder";
        createFolderBtn.style.display = "none";
        resetBtn.style.display = "none";
    }

    showToast("Drag mode disabled", "info");
}

/**
 * Handle drag start event
 */
function handleDragStart(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    draggedElement = target;
    target.classList.add("dragging");

    // Set drag data
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "");
    }

    // Prevent conflicts with page handlers
    e.stopPropagation();
}

/**
 * Handle drag over event
 */
function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
    }
}

/**
 * Handle drag enter event
 */
function handleDragEnter(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    if (target !== draggedElement) {
        target.classList.add("drag-over");
    }
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e: DragEvent): void {
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as Node | null;

    // Only remove class if we're actually leaving the element (not entering a child)
    if (!relatedTarget || !target.contains(relatedTarget)) {
        target.classList.remove("drag-over");
    }
}

/**
 * Handle drop event - folder-aware version
 */
async function handleDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.classList.remove("drag-over");

    if (!draggedElement || draggedElement === target) return;

    const isDraggedTile = draggedElement.classList.contains("flw-item");
    const isDraggedFolder = draggedElement.classList.contains("anime-folder");
    const isTargetTile = target.classList.contains("flw-item");
    const isTargetFolder = target.classList.contains("anime-folder");

    // Check if dragged element is coming from inside a folder
    const draggedFromFolder = draggedElement.closest(".anime-folder-content");
    const sourceFolderId = draggedFromFolder?.closest(".anime-folder")?.getAttribute("data-folder-id") || null;

    // Determine drop position (before or after target)
    const targetRect = target.getBoundingClientRect();
    const isHorizontal = targetRect.width > targetRect.height;
    let dropPosition: "before" | "after";
    if (isHorizontal) {
        dropPosition = e.clientX < targetRect.left + targetRect.width / 2 ? "before" : "after";
    } else {
        dropPosition = e.clientY < targetRect.top + targetRect.height / 2 ? "before" : "after";
    }

    // Determine target container
    const targetInFolder = target.closest(".anime-folder-content");
    const targetFolderId = targetInFolder?.closest(".anime-folder")?.getAttribute("data-folder-id") || null;

    // Case 1: Tile from folder being dropped at root (on another root tile or folder)
    if (isDraggedTile && sourceFolderId && !targetFolderId) {
        await handleDropFromFolderToRoot(
            draggedElement,
            dropPosition === "before" ? target : target.nextElementSibling,
        );
        return;
    }

    // Case 2: Tile being dropped into a different folder (handled by folder drop zone)
    // This case is handled by setupFolderDropZone, but if dropping on a tile inside a folder:
    if (isDraggedTile && targetFolderId && sourceFolderId !== targetFolderId) {
        await handleDropIntoFolder(draggedElement, targetFolderId);
        return;
    }

    // Case 3: Reordering within the same folder
    if (isDraggedTile && isTargetTile && sourceFolderId && sourceFolderId === targetFolderId) {
        // Reorder within folder
        const folderContent = targetInFolder;
        if (folderContent) {
            if (dropPosition === "before") {
                folderContent.insertBefore(draggedElement, target);
            } else {
                folderContent.insertBefore(draggedElement, target.nextSibling);
            }
        }
        // Save folder contents order
        debouncedSaveFolderOrder(sourceFolderId);
        return;
    }

    // Case 4: Reordering at root level (tiles and folders)
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (container && (isDraggedTile || isDraggedFolder) && (isTargetTile || isTargetFolder)) {
        // Only reorder at root level (not inside a folder)
        if (!sourceFolderId && !targetFolderId) {
            if (dropPosition === "before") {
                container.insertBefore(draggedElement, target);
            } else {
                container.insertBefore(draggedElement, target.nextSibling);
            }
            // Save root order
            debouncedSaveRootOrder();
        }
    }
}

/**
 * Debounced save for folder contents order
 */
function debouncedSaveFolderOrder(folderId: string): void {
    if (saveFolderOrderTimeout) {
        clearTimeout(saveFolderOrderTimeout);
    }
    saveFolderOrderTimeout = setTimeout(async () => {
        const folderOrder = await loadFolderOrder();
        const folderContent = document.querySelector(`[data-folder-id="${folderId}"] .anime-folder-content`);
        if (folderContent) {
            const tiles = folderContent.querySelectorAll(SELECTORS.ITEM);
            const animeIds: string[] = [];
            tiles.forEach((tile) => {
                const animeData = extractAnimeData(tile);
                if (animeData) animeIds.push(animeData.animeId);
            });
            folderOrder.folderContents[folderId] = animeIds;
            await saveFolderOrder(folderOrder);
        }
        showToast("Order saved", "success");
    }, 500);
}

/**
 * Debounced save for root level order
 */
function debouncedSaveRootOrder(): void {
    if (saveRootOrderTimeout) {
        clearTimeout(saveRootOrderTimeout);
    }
    saveRootOrderTimeout = setTimeout(async () => {
        const folderOrder = await loadFolderOrder();
        const container = document.querySelector(SELECTORS.CONTAINER);
        if (container) {
            const rootItems: string[] = [];
            // Get direct children only (not tiles inside folders)
            const children = container.children;
            for (const child of children) {
                if (child.classList.contains("anime-folder")) {
                    const folderId = child.getAttribute("data-folder-id");
                    if (folderId) rootItems.push(`folder:${folderId}`);
                } else if (child.classList.contains("flw-item")) {
                    const animeData = extractAnimeData(child);
                    if (animeData) rootItems.push(animeData.animeId);
                }
            }
            folderOrder.rootItems = rootItems;
            await saveFolderOrder(folderOrder);
        }
        showToast("Order saved", "success");
    }, 500);
}

/**
 * Handle drag end event
 */
function handleDragEnd(e: DragEvent): void {
    e.stopPropagation();

    if (draggedElement) {
        draggedElement.classList.remove("dragging");
        draggedElement = null;
    }

    // Clean up any remaining drag-over classes
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (container) {
        container.querySelectorAll(".drag-over").forEach((item) => {
            item.classList.remove("drag-over");
        });
    }
}

/**
 * Restore tile order from storage
 */
export async function restoreTileOrder(): Promise<void> {
    const tileOrder = await loadTileOrder();
    if (!tileOrder || tileOrder.animeIds.length === 0) return;

    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    const items = container.querySelectorAll(SELECTORS.ITEM);
    const itemMap = new Map<string, Element>();

    // Build map of anime ID to element
    items.forEach((item) => {
        const animeData = extractAnimeData(item);
        if (animeData) {
            itemMap.set(animeData.animeId, item);
        }
    });

    // Reorder elements according to saved order
    const orderedElements: Element[] = [];
    const unorderedElements: Element[] = [];

    // First, add elements in saved order
    tileOrder.animeIds.forEach((animeId) => {
        const element = itemMap.get(animeId);
        if (element) {
            orderedElements.push(element);
            itemMap.delete(animeId);
        }
    });

    // Then, add any remaining elements (new tiles not in saved order)
    itemMap.forEach((element) => {
        unorderedElements.push(element);
    });

    // Append elements in new order
    const allElements = [...orderedElements, ...unorderedElements];
    allElements.forEach((element) => {
        container.appendChild(element);
    });

    console.log(
        "[ContentScript] Restored tile order:",
        orderedElements.length,
        "ordered,",
        unorderedElements.length,
        "new",
    );
}

/**
 * Reset tile order to default
 */
export async function resetTileOrder(): Promise<void> {
    await clearTileOrder();
    showToast("Order reset - reloading page", "info");
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

/**
 * Initialize drag-and-drop functionality
 */
export async function initializeDragAndDrop(): Promise<void> {
    // Only initialize if container exists
    const container = document.querySelector(SELECTORS.CONTAINER);
    if (!container) return;

    // Insert toolbar
    insertDragToolbar();

    // Restore saved order (folders and tiles)
    await restoreFolderOrder();
}

// Only auto-initialize if not in test environment
if (typeof window !== "undefined" && typeof document !== "undefined" && (globalThis as any).window?.location) {
    init();

    // Initialize single page functionality
    setTimeout(() => {
        initializeSinglePage();
    }, 1000);
}
