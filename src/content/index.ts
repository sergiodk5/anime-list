console.log("Hello from content script!");

// -------------------
// DEBUGGING UTILITIES
// -------------------

const getLogContainer = (): HTMLElement => {
    let container = document.getElementById("content-script-log-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "content-script-log-container";
        container.style.position = "fixed";
        container.style.bottom = "10px";
        container.style.left = "10px";
        container.style.width = "300px";
        container.style.height = "400px";
        container.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        container.style.color = "white";
        container.style.border = "1px solid #ccc";
        container.style.borderRadius = "5px";
        container.style.padding = "10px";
        container.style.overflowY = "scroll";
        container.style.zIndex = "999999";
        container.style.fontSize = "12px";
        container.style.fontFamily = "monospace";
        document.body.appendChild(container);
    }
    return container;
};

const logToDOM = (...args: any[]) => {
    // Also log to console as a fallback
    console.log(...args);

    const container = getLogContainer();
    const message = args
        .map((arg) => {
            if (typeof arg === "object" && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return "[Unserializable Object]";
                }
            }
            return String(arg);
        })
        .join(" ");

    const logEntry = document.createElement("pre");
    logEntry.textContent = message;
    logEntry.style.margin = "0";
    logEntry.style.padding = "2px 0";
    logEntry.style.borderBottom = "1px solid #444";
    logEntry.style.whiteSpace = "pre-wrap"; // Wrap long lines
    logEntry.style.wordBreak = "break-all";

    container.appendChild(logEntry);
    // Scroll to the bottom
    container.scrollTop = container.scrollHeight;
};

// -------------------
// INTERFACES & TYPES
// -------------------
interface EpisodeProgress {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    currentEpisode: number;
    episodeId: string;
    lastWatched: string;
    totalEpisodes?: number;
}

interface PlanToWatch {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    addedAt: string;
}

interface AnimeData {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
}

// -------------------
// STORAGE UTILITIES
// -------------------

const getStorageData = <T>(key: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result[key] as T);
        });
    });
};

const setStorageData = (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};

// -- Episode Progress --
const getAllEpisodeProgress = async (): Promise<Record<string, EpisodeProgress>> => {
    return (await getStorageData<Record<string, EpisodeProgress>>("episodeProgress")) || {};
};

const saveEpisodeProgress = async (progress: EpisodeProgress): Promise<void> => {
    const allProgress = await getAllEpisodeProgress();
    allProgress[progress.animeId] = progress;
    await setStorageData("episodeProgress", allProgress);
    logToDOM("Saved episode progress for:", progress.animeTitle);
};

// -- Plan to Watch --
const getAllPlanToWatch = async (): Promise<Record<string, PlanToWatch>> => {
    return (await getStorageData<Record<string, PlanToWatch>>("planToWatch")) || {};
};

const savePlanToWatch = async (plan: PlanToWatch): Promise<void> => {
    const allPlans = await getAllPlanToWatch();
    allPlans[plan.animeId] = plan;
    await setStorageData("planToWatch", allPlans);
    logToDOM("Saved plan to watch for:", plan.animeTitle);
};

const removePlanToWatch = async (animeId: string): Promise<void> => {
    const allPlans = await getAllPlanToWatch();
    delete allPlans[animeId];
    await setStorageData("planToWatch", allPlans);
    logToDOM("Removed plan to watch for animeId:", animeId);
};

// -- Hidden Anime --
const getHiddenAnime = async (): Promise<string[]> => {
    return (await getStorageData<string[]>("hiddenAnime")) || [];
};

const addHiddenAnime = async (animeId: string): Promise<void> => {
    const hiddenList = await getHiddenAnime();
    if (!hiddenList.includes(animeId)) {
        hiddenList.push(animeId);
        await setStorageData("hiddenAnime", hiddenList);
        logToDOM("Added animeId to hidden list:", animeId);
    }
};

const clearHiddenAnime = async (): Promise<void> => {
    await setStorageData("hiddenAnime", []);
    logToDOM("Hidden anime list cleared.");
};

// -------------------
// DOM MANIPULATION & UI
// -------------------

const createButton = (text: string, color: string, callback: (e: MouseEvent) => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.backgroundColor = color;
    button.style.color = "white";
    button.style.border = "none";
    button.style.padding = "5px";
    button.style.cursor = "pointer";
    button.addEventListener("click", callback);

    return button;
};

const createWrapper = (parentPoster: HTMLElement) => {
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.right = "0";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center"; // Center buttons
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "4px"; // Add a gap between buttons
    wrapper.style.zIndex = "10";
    wrapper.style.backgroundColor = "rgba(0,0,0,0.5)";
    wrapper.style.padding = "10px";
    wrapper.style.opacity = "0";
    wrapper.style.transition = "opacity 0.3s";
    wrapper.style.pointerEvents = "none"; // Allow clicks to go through to the link

    parentPoster.addEventListener("mouseenter", () => {
        wrapper.style.opacity = "1";
        wrapper.style.pointerEvents = "auto"; // Enable clicks on the button
    });
    parentPoster.addEventListener("mouseleave", () => {
        wrapper.style.opacity = "0";
        wrapper.style.pointerEvents = "none";
    });

    return wrapper;
};

const parseAnimeItem = (item: HTMLElement): AnimeData | null => {
    const anchor = item.querySelector(".film-name a") as HTMLAnchorElement;
    if (!anchor || !anchor.href || !anchor.textContent) return null;

    const url = new URL(anchor.href);
    const pathParts = url.pathname.split("/");
    const animeSlug = pathParts[pathParts.length - 1];
    const animeIdMatch = animeSlug.match(/-(\d+)$/);
    const animeId = animeIdMatch ? animeIdMatch[1] : null;

    if (!animeId) {
        console.warn("Could not parse anime ID from slug:", animeSlug);
        return null;
    }

    return {
        animeId,
        animeTitle: anchor.textContent.trim(),
        animeSlug,
    };
};

const updateButtonState = (
    buttonWrapper: HTMLElement,
    animeData: AnimeData,
    isPlanned: boolean,
    isTracked: boolean,
) => {
    buttonWrapper.innerHTML = ""; // Clear existing button

    let button;
    if (isTracked) {
        button = createButton("Tracked", "#6a0dad", (e) => {
            e.stopPropagation();
            e.preventDefault();
            const watchUrl = `/watch/${animeData.animeSlug}`;
            window.location.href = watchUrl;
        });
    } else if (isPlanned) {
        button = createButton("Planned", "#ffA500", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await removePlanToWatch(animeData.animeId);
            updateButtonState(buttonWrapper, animeData, false, false);
        });
    } else {
        button = createButton("Plan", "#4CAF50", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await savePlanToWatch({ ...animeData, addedAt: new Date().toISOString() });
            updateButtonState(buttonWrapper, animeData, true, false);
        });
    }

    if (button) {
        button.style.flex = "1"; // Make buttons share space equally
        buttonWrapper.appendChild(button);
    }

    // The "Hide" button should appear for all states (Plan, Planned, Tracked)
    const hideButton = createButton("Hide", "#f44336", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await addHiddenAnime(animeData.animeId);
        const item = buttonWrapper.closest(".flw-item") as HTMLElement;
        if (item) {
            item.style.display = "none";
        }
    });
    hideButton.style.flex = "1"; // Make buttons share space equally
    buttonWrapper.appendChild(hideButton);
};

const createClearHiddenButton = () => {
    const button = createButton("Show Hidden Anime", "#1E90FF", async () => {
        if (confirm("Are you sure you want to show all hidden anime?")) {
            await clearHiddenAnime();
            location.reload(); // Reload the page to show the items
        }
    });

    button.id = "clear-hidden-button";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.zIndex = "100000";
    button.style.width = "auto";
    button.style.padding = "10px 15px";
    button.style.borderRadius = "5px";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";

    return button;
};

const createStartWatchingButton = (animeData: AnimeData, episodeId: string | null) => {
    logToDOM("createStartWatchingButton called with:", animeData);
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "fixed";
    buttonContainer.style.top = "100px";
    buttonContainer.style.right = "20px";
    buttonContainer.style.zIndex = "99999";
    buttonContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    buttonContainer.style.padding = "15px";
    buttonContainer.style.borderRadius = "8px";
    buttonContainer.style.textAlign = "center";

    const title = document.createElement("h3");
    title.textContent = `Start tracking "${animeData.animeTitle}"?`;
    title.style.color = "white";
    title.style.marginBottom = "10px";
    buttonContainer.appendChild(title);

    const startButton = createButton("Start Watching", "#4CAF50", async () => {
        // 1. Remove from plan to watch
        await removePlanToWatch(animeData.animeId);

        // 2. Add to episode progress (starting at episode 1)
        await saveEpisodeProgress({
            ...animeData,
            currentEpisode: 1, // Default to episode 1
            episodeId: episodeId || "",
            lastWatched: new Date().toISOString(),
        });

        // 3. Remove this button and initialize the real tracker
        buttonContainer.remove();
        initWatchPage(); // Re-run to show the tracker
    });
    buttonContainer.appendChild(startButton);

    logToDOM("createStartWatchingButton: Returning button container element:", buttonContainer);
    return buttonContainer;
};

const createEpisodeTrackerUI = (progress: EpisodeProgress) => {
    const container = document.createElement("div");
    container.id = "episode-tracker-container";
    container.style.position = "fixed";
    container.style.top = "100px";
    container.style.right = "20px";
    container.style.zIndex = "99999";
    container.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    container.style.padding = "15px";
    container.style.borderRadius = "8px";
    container.style.textAlign = "center";
    container.style.color = "white";
    container.style.fontFamily = "sans-serif";

    const title = document.createElement("h4");
    title.textContent = "Episode Tracker";
    title.style.margin = "0 0 5px 0";
    container.appendChild(title);

    const animeTitle = document.createElement("p");
    animeTitle.textContent = progress.animeTitle;
    animeTitle.style.margin = "0 0 10px 0";
    animeTitle.style.fontSize = "14px";
    animeTitle.style.fontWeight = "bold";
    container.appendChild(animeTitle);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.justifyContent = "center";
    controls.style.gap = "10px";

    const episodeDisplay = document.createElement("span");
    episodeDisplay.id = "current-episode-display";
    episodeDisplay.textContent = String(progress.currentEpisode);
    episodeDisplay.style.fontSize = "18px";
    episodeDisplay.style.minWidth = "30px";

    const updateEpisode = async (newEpisode: number) => {
        if (newEpisode < 1) return; // Can't go below episode 1

        // Update local state first for responsiveness
        episodeDisplay.textContent = String(newEpisode);

        // Create a new progress object with the updated episode
        const newProgress: EpisodeProgress = {
            ...progress,
            currentEpisode: newEpisode,
            lastWatched: new Date().toISOString(),
        };

        // Save to storage
        await saveEpisodeProgress(newProgress);
    };

    const decrementButton = createButton("-", "#ffA500", () => {
        const current = parseInt(episodeDisplay.textContent || "1", 10);
        updateEpisode(current - 1);
    });
    decrementButton.style.width = "30px";
    decrementButton.style.height = "30px";
    decrementButton.style.borderRadius = "50%";
    decrementButton.style.lineHeight = "30px";
    decrementButton.style.padding = "0";

    const incrementButton = createButton("+", "#4CAF50", () => {
        const current = parseInt(episodeDisplay.textContent || "0", 10);
        updateEpisode(current + 1);
    });
    incrementButton.style.width = "30px";
    incrementButton.style.height = "30px";
    incrementButton.style.borderRadius = "50%";
    incrementButton.style.lineHeight = "30px";
    incrementButton.style.padding = "0";

    controls.appendChild(decrementButton);
    controls.appendChild(episodeDisplay);
    controls.appendChild(incrementButton);
    container.appendChild(controls);

    return container;
};

// -------------------
// PAGE DETECTORS
// -------------------
const isWatchPage = (): boolean => {
    // Rule 2: If the url has path `/watch`
    return window.location.pathname.includes("/watch/");
};

const isListingPage = (): boolean => {
    // Rule 1: If the DOM has element with css class `.film_list-wrap`
    return !!document.querySelector(".film_list-wrap");
};

// -------------------
// PARSERS
// -------------------
const parseWatchUrl = (): (AnimeData & { episodeId: string | null }) | null => {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split("/");
    const animeSlug = pathParts[pathParts.length - 1];
    const animeIdMatch = animeSlug.match(/-(\d+)$/);
    let animeId = animeIdMatch ? animeIdMatch[1] : null;

    // Fallback to data-id attribute on the page
    if (!animeId) {
        const wrapperElement = document.querySelector("#wrapper[data-id]");
        if (wrapperElement) {
            animeId = wrapperElement.getAttribute("data-id");
        }
    }

    if (!animeId) {
        logToDOM("Could not determine anime ID from URL or page data.");
        return null;
    }

    const animeTitle =
        document.querySelector(".film-name")?.textContent?.trim() || animeSlug.replace(/-\d+$/, "").replace(/-/g, " ");

    return {
        animeId,
        animeTitle,
        animeSlug,
        episodeId: url.searchParams.get("ep"),
    };
};

// -------------------
// MAIN EXECUTION
// -------------------

const initListingPage = async () => {
    const wrapper = document.querySelector(".film_list-wrap");
    if (!wrapper) return;

    logToDOM("Initializing listing page...");

    // Add the clear hidden button if it doesn't exist
    if (!document.querySelector("#clear-hidden-button")) {
        document.body.appendChild(createClearHiddenButton());
    }

    const films = wrapper.querySelectorAll(".flw-item");
    const allProgress = await getAllEpisodeProgress();
    const allPlans = await getAllPlanToWatch();
    const allHidden = await getHiddenAnime();

    films.forEach((item) => {
        const movie = item as HTMLElement;
        const poster = movie.querySelector(".film-poster") as HTMLElement;
        if (!poster) return;
        poster.style.position = "relative";

        const animeData = parseAnimeItem(movie);
        if (!animeData) return;

        // Hide the item if it's in the hidden list
        if (allHidden.includes(animeData.animeId)) {
            movie.style.display = "none";
            return;
        }

        // Check if a wrapper already exists
        if (movie.querySelector(".action-wrapper")) return;

        const buttonWrapper = createWrapper(poster);
        buttonWrapper.className = "action-wrapper"; // Add class for checking
        poster.appendChild(buttonWrapper);

        const isTracked = !!allProgress[animeData.animeId];
        const isPlanned = !!allPlans[animeData.animeId];

        updateButtonState(buttonWrapper, animeData, isPlanned, isTracked);
    });
};

const initWatchPage = async () => {
    logToDOM("Initializing watch page...");
    const animeInfo = parseWatchUrl();
    logToDOM("Watch Page - Anime Info:", animeInfo);
    if (!animeInfo) {
        logToDOM("Watch Page: Could not parse anime info. Aborting.");
        return;
    }

    const allProgress = await getAllEpisodeProgress();
    const allPlans = await getAllPlanToWatch();
    logToDOM("Watch Page - All Progress:", allProgress);
    logToDOM("Watch Page - All Plans:", allPlans);

    const isTracked = !!allProgress[animeInfo.animeId];
    const isPlanned = !!allPlans[animeInfo.animeId];
    logToDOM("Watch Page - isPlanned:", isPlanned, "isTracked:", isTracked, "for animeId:", animeInfo.animeId);

    // Clean up any existing UI before adding new ones
    document.querySelector("#start-watching-container")?.remove();
    document.querySelector("#episode-tracker-container")?.remove();
    document.querySelector("#plan-to-watch-container")?.remove();

    // If it's in "Plan to Watch" but not tracked yet, show the "Start Watching" button.
    if (isPlanned && !isTracked) {
        logToDOM("Watch Page: Condition met - Show 'Start Watching' button.");
        const startButton = createStartWatchingButton(animeInfo, animeInfo.episodeId);
        startButton.id = "start-watching-container";
        document.body.appendChild(startButton);
    } else if (isTracked) {
        logToDOM("Watch Page: Condition met - Show episode tracker.");
        const progress = allProgress[animeInfo.animeId];
        const trackerUI = createEpisodeTrackerUI(progress);
        document.body.appendChild(trackerUI);
    } else {
        logToDOM("Watch Page: Condition met - Show 'Plan to Watch' button.");
        // If not planned and not tracked, show a "Plan to Watch" button
        const planButtonContainer = document.createElement("div");
        planButtonContainer.id = "plan-to-watch-container";
        planButtonContainer.style.position = "fixed";
        planButtonContainer.style.top = "100px";
        planButtonContainer.style.right = "20px";
        planButtonContainer.style.zIndex = "99999";
        planButtonContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        planButtonContainer.style.padding = "15px";
        planButtonContainer.style.borderRadius = "8px";
        planButtonContainer.style.textAlign = "center";

        const planButton = createButton("Plan to Watch", "#4CAF50", async () => {
            await savePlanToWatch({ ...animeInfo, addedAt: new Date().toISOString() });
            planButtonContainer.remove(); // Remove this button
            initWatchPage(); // Re-run to show the "Start Watching" button
        });
        planButtonContainer.appendChild(planButton);
        document.body.appendChild(planButtonContainer);
    }
};

const runCurrentPageLogic = () => {
    const onWatchPage = isWatchPage();
    const onListingPage = isListingPage();

    logToDOM(`Page check: isWatchPage=${onWatchPage}, isListingPage=${onListingPage}`);

    if (onWatchPage) {
        // On watch page, we don't want the clear button
        logToDOM("Running watch page logic.");
        document.querySelector("#clear-hidden-button")?.remove();
        initWatchPage();
    } else if (onListingPage) {
        logToDOM("Running listing page logic.");
        initListingPage();
    } else {
        // If we are on neither a listing nor a watch page, ensure the clear button is removed.
        logToDOM("Running cleanup logic for other pages.");
        document.querySelector("#clear-hidden-button")?.remove();
    }
};

const init = () => {
    // Use MutationObserver to handle dynamic page loads (SPA behavior)
    const observer = new MutationObserver(() => {
        // No need for complex checks, just re-run the logic.
        // The functions are idempotent, so it's safe to call them multiple times.
        runCurrentPageLogic();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Initial run in case the content is already there
    runCurrentPageLogic();
};

// init();
