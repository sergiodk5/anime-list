console.log("Hello from content script!");

// TypeScript interfaces
interface EpisodeProgress {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    currentEpisode: number;
    episodeId: string;
    lastWatched: string;
    totalEpisodes?: number;
}

interface EpisodeMapping {
    animeId: string;
    episodeId: string;
    episodeNumber: number;
    animeSlug: string;
    url: string;
    detectedAt: string;
}

// Utility functions
const isWatchPage = (): boolean => {
    return (
        window.location.pathname.includes("/watch/") || document.querySelector('#wrapper[data-page="watch"]') !== null
    );
};

const isListingPage = (): boolean => {
    return document.querySelector(".film_list-wrap") !== null || document.querySelector(".flw-item") !== null;
};

const parseWatchUrl = (url: string = window.location.href) => {
    // Parse: https://hianime.to/watch/the-rising-of-the-shield-hero-season-3-15571?ep=109052
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const animeSlug = pathParts[pathParts.length - 1]; // "the-rising-of-the-shield-hero-season-3-15571"
    const animeIdMatch = animeSlug.match(/-(\d+)$/); // Extract "15571"
    let animeId = animeIdMatch ? animeIdMatch[1] : null;

    // Also try to get anime ID from page wrapper data-id attribute (more reliable for HiAnime)
    const wrapperElement = document.querySelector("#wrapper[data-id]");
    if (wrapperElement && !animeId) {
        animeId = wrapperElement.getAttribute("data-id");
    }

    const episodeId = urlObj.searchParams.get("ep"); // "109052" - gets first occurrence

    // Extract anime title (remove ID suffix)
    const animeTitle = animeSlug
        .replace(/-\d+$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()); // Convert to title case

    return {
        animeSlug,
        animeId,
        animeTitle,
        episodeId,
        fullUrl: url,
    };
};

// Inject CSS styles into the page
const injectStyles = () => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .anime-list-ext-btn {
            border: none !important;
            border-radius: 4px !important;
            padding: 8px 16px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            backdrop-filter: blur(8px) !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            outline: none !important;
            user-select: none !important;
            color: white !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            text-decoration: none !important;
            display: inline-block !important;
        }
        
        .anime-list-ext-btn--add {
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%) !important;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
        }
        
        .anime-list-ext-btn--remove {
            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%) !important;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
        }
        
        .anime-list-ext-btn--danger {
            background: linear-gradient(135deg, #991b1b 0%, #7c2d12 100%) !important;
            box-shadow: 0 4px 12px rgba(153, 27, 27, 0.4) !important;
        }
        
        .anime-list-ext-btn--episode {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
        }
        
        .anime-list-ext-btn:hover {
            transform: translateY(-2px) scale(1.05) !important;
        }
        
        .anime-list-ext-btn--add:hover {
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(59, 130, 246, 0.2) !important;
        }
        
        .anime-list-ext-btn--remove:hover {
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(249, 115, 22, 0.2) !important;
        }
        
        .anime-list-ext-btn--danger:hover {
            box-shadow: 0 8px 20px rgba(153, 27, 27, 0.5), 0 4px 12px rgba(124, 45, 18, 0.3) !important;
        }
        
        .anime-list-ext-btn--episode:hover {
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(124, 58, 237, 0.3) !important;
        }
        
        .anime-list-ext-btn:active {
            transform: translateY(0) scale(0.95) !important;
        }
        
        .anime-list-ext-episode-tracker {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 99999 !important;
            background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%) !important;
            backdrop-filter: blur(12px) !important;
            padding: 16px !important;
            border-radius: 8px !important;
            color: white !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
            max-width: 300px !important;
            box-sizing: border-box !important;
        }
        
        .anime-list-ext-episode-info {
            margin-bottom: 12px !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
        }
        
        .anime-list-ext-episode-title {
            font-weight: 600 !important;
            margin-bottom: 4px !important;
            font-size: 16px !important;
        }
        
        .anime-list-ext-wrapper {
            width: 100% !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            z-index: 99999 !important;
            background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%) !important;
            backdrop-filter: blur(12px) !important;
            padding: 12px !important;
            opacity: 0 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            gap: 8px !important;
            transform: translateY(-4px) !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            border: none !important;
            left: auto !important;
            bottom: auto !important;
        }
        
        .flw-item:hover .anime-list-ext-wrapper {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        .anime-list-ext-progress-indicator {
            position: absolute !important;
            bottom: 8px !important;
            right: 8px !important;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%) !important;
            color: white !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            backdrop-filter: blur(8px) !important;
            z-index: 10 !important;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3) !important;
        }
        
        .anime-list-ext-continue-section {
            margin: 20px 0 !important;
            padding: 16px !important;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%) !important;
            border-radius: 8px !important;
            border: 1px solid rgba(139, 92, 246, 0.3) !important;
        }
        
        .anime-list-ext-continue-title {
            font-size: 18px !important;
            font-weight: 700 !important;
            color: #8b5cf6 !important;
            margin-bottom: 12px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .anime-list-ext-continue-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 12px !important;
            margin: 8px 0 !important;
            background: rgba(255, 255, 255, 0.8) !important;
            border-radius: 6px !important;
            border: 1px solid rgba(139, 92, 246, 0.2) !important;
        }
        
        .anime-list-ext-continue-info {
            flex-grow: 1 !important;
        }
        
        .anime-list-ext-continue-anime {
            font-weight: 600 !important;
            color: #374151 !important;
        }
        
        .anime-list-ext-continue-episode {
            font-size: 12px !important;
            color: #6b7280 !important;
        }
        
        .anime-list-ext-notification {
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            background: linear-gradient(135deg, rgba(255, 165, 0, 0.9) 0%, rgba(255, 140, 0, 0.9) 100%) !important;
            color: white !important;
            padding: 12px !important;
            border-radius: 6px !important;
            z-index: 100000 !important;
            max-width: 300px !important;
            font-size: 13px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            box-shadow: 0 4px 16px rgba(255, 165, 0, 0.3) !important;
            backdrop-filter: blur(8px) !important;
        }
        
        .anime-list-ext-episode-prompt {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 100001 !important;
            background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%) !important;
            backdrop-filter: blur(16px) !important;
            padding: 24px !important;
            border-radius: 12px !important;
            color: white !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
            min-width: 400px !important;
            text-align: center !important;
        }
        
        .anime-list-ext-episode-prompt h3 {
            margin: 0 0 16px 0 !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            color: #8b5cf6 !important;
        }
        
        .anime-list-ext-episode-prompt p {
            margin: 0 0 20px 0 !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            color: #e5e7eb !important;
        }
        
        .anime-list-ext-episode-prompt input {
            width: 100px !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            border: 2px solid #8b5cf6 !important;
            background: rgba(255,255,255,0.1) !important;
            color: white !important;
            font-size: 16px !important;
            text-align: center !important;
            margin: 0 8px !important;
        }
        
        .anime-list-ext-episode-prompt input:focus {
            outline: none !important;
            border-color: #a855f7 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3) !important;
        }
        
        .anime-list-ext-prompt-buttons {
            display: flex !important;
            gap: 12px !important;
            justify-content: center !important;
            margin-top: 20px !important;
        }
        
        .anime-list-ext-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.6) !important;
            z-index: 100000 !important;
            backdrop-filter: blur(4px) !important;
        }

        .anime-list-ext-watched-episode {
            opacity: 0.6 !important;
            background: rgba(139, 92, 246, 0.1) !important;
            border-radius: 4px;
        }

        .anime-list-ext-watched-episode:hover {
            opacity: 0.9 !important;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
            20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
    `;
    document.head.appendChild(styleSheet);
};

const createButton = (text: string, variant: "add" | "remove" | "danger" | "episode", callback: () => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `anime-list-ext-btn anime-list-ext-btn--${variant}`;
    button.addEventListener("click", callback);
    return button;
};

// Function to show a temporary notification on the page
const showNotification = (message: string, duration: number = 3000) => {
    const notification = document.createElement("div");
    notification.className = "anime-list-ext-notification";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transition = "opacity 0.5s ease";
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
    }, duration);
};

// Episode mapping functions
const saveEpisodeMapping = (mapping: EpisodeMapping): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodeMappings", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (saveEpisodeMapping - get):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            const mappings: EpisodeMapping[] = data.episodeMappings || [];

            // Find existing mapping for this anime + episode ID
            const existingIndex = mappings.findIndex(
                (m) => m.animeId === mapping.animeId && m.episodeId === mapping.episodeId,
            );

            if (existingIndex >= 0) {
                // Update existing mapping
                mappings[existingIndex] = mapping;
            } else {
                // Add new mapping
                mappings.push(mapping);
            }

            chrome.storage.local.set({ episodeMappings: mappings }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage Error (saveEpisodeMapping - set):", chrome.runtime.lastError);
                    return reject(chrome.runtime.lastError);
                }
                console.log("Episode mapping saved:", mapping);
                resolve();
            });
        });
    });
};

const getEpisodeMapping = (animeId: string, episodeId: string): Promise<EpisodeMapping | null> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodeMappings", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (getEpisodeMapping):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            const mappings: EpisodeMapping[] = data.episodeMappings || [];
            const mapping = mappings.find((m) => m.animeId === animeId && m.episodeId === episodeId);
            resolve(mapping || null);
        });
    });
};

// Episode tracking functions
const saveEpisodeProgress = (episodeData: EpisodeProgress): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodes", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (saveEpisodeProgress - get):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            const episodes: EpisodeProgress[] = data.episodes || [];

            // Find existing progress for this anime
            const existingIndex = episodes.findIndex((ep) => ep.animeId === episodeData.animeId);

            if (existingIndex >= 0) {
                // Update existing progress
                episodes[existingIndex] = episodeData;
            } else {
                // Add new progress
                episodes.push(episodeData);
            }

            chrome.storage.local.set({ episodes }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage Error (saveEpisodeProgress - set):", chrome.runtime.lastError);
                    return reject(chrome.runtime.lastError);
                }
                console.log("Episode progress saved:", episodeData);
                resolve();
            });
        });
    });
};

const getEpisodeProgress = (animeId: string): Promise<EpisodeProgress | null> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodes", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (getEpisodeProgress):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            const episodes: EpisodeProgress[] = data.episodes || [];
            const progress = episodes.find((ep) => ep.animeId === animeId);
            resolve(progress || null);
        });
    });
};

const removeEpisodeProgress = (animeId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodes", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (removeEpisodeProgress - get):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            let episodes: EpisodeProgress[] = data.episodes || [];
            episodes = episodes.filter((ep) => ep.animeId !== animeId);

            chrome.storage.local.set({ episodes }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage Error (removeEpisodeProgress - set):", chrome.runtime.lastError);
                    return reject(chrome.runtime.lastError);
                }
                console.log("Episode progress removed for animeId:", animeId);
                resolve();
            });
        });
    });
};

const removeAllEpisodeMappings = (animeId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodeMappings", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (removeAllEpisodeMappings - get):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            let mappings: EpisodeMapping[] = data.episodeMappings || [];
            mappings = mappings.filter((m) => m.animeId !== animeId);

            chrome.storage.local.set({ episodeMappings: mappings }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage Error (removeAllEpisodeMappings - set):", chrome.runtime.lastError);
                    return reject(chrome.runtime.lastError);
                }
                console.log("All episode mappings removed for animeId:", animeId);
                resolve();
            });
        });
    });
};

// Enhanced URL-first episode detection
const detectEpisodeFromUrl = async (): Promise<{ episodeId: string | null; episodeNumber: number }> => {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get("ep");

    if (!episodeId) {
        console.log("No episode ID found in URL");
        return { episodeId: null, episodeNumber: 1 };
    }

    // Try to get anime ID
    const watchData = parseWatchUrl();
    if (!watchData.animeId) {
        console.log("No anime ID found, cannot map episode");
        return { episodeId, episodeNumber: 1 };
    }

    // Check if we have a stored mapping for this episode ID
    try {
        const existingMapping = await getEpisodeMapping(watchData.animeId, episodeId);
        if (existingMapping) {
            console.log("Found existing episode mapping:", existingMapping);
            return { episodeId, episodeNumber: existingMapping.episodeNumber };
        }
    } catch (error) {
        console.error("Failed to get episode mapping:", error);
        // Continue without mapping, will fallback to detection
    }

    // Try to detect episode number from page title
    const titleElement = document.querySelector("title");
    if (titleElement) {
        const titleText = titleElement.textContent || "";
        const match = titleText.match(/(?:episode|ep)\s*(\d+)/i);
        if (match) {
            const episodeNumber = parseInt(match[1], 10);
            console.log("Detected episode number from title:", episodeNumber);

            // Save this mapping for future use
            const mapping: EpisodeMapping = {
                animeId: watchData.animeId,
                episodeId,
                episodeNumber,
                animeSlug: watchData.animeSlug,
                url: window.location.href,
                detectedAt: new Date().toISOString(),
            };
            try {
                await saveEpisodeMapping(mapping);
            } catch (error) {
                console.error("Failed to save auto-detected episode mapping:", error);
                // Non-critical, just log it. The extension will still work.
            }

            return { episodeId, episodeNumber };
        }
    }

    // Fallback: ask user to confirm episode number (for now, just return 1)
    console.log("Could not detect episode number, defaulting to 1. Episode ID:", episodeId);
    return { episodeId, episodeNumber: 1 };
};

// Enhanced total episode detection specifically for HiAnime structure
const detectTotalEpisodes = (): number | null => {
    // Method 1: Check for .tick-item.tick-eps (most reliable for HiAnime - confirmed from HTML)
    const tickEps = document.querySelector(".tick-item.tick-eps");
    if (tickEps) {
        const epsText = tickEps.textContent || "";
        const match = epsText.match(/(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    // Method 2: Remove - .ep-item doesn't exist in actual HiAnime HTML

    // Method 3: Try to find episode count in page text as last resort
    const pageText = document.body.textContent || "";
    const match = pageText.match(/(\d+)\s*(?:episodes?|eps?)/i);
    if (match) {
        const episodeCount = parseInt(match[1], 10);
        // Sanity check - episode counts should be reasonable (1-10000)
        if (episodeCount >= 1 && episodeCount <= 10000) {
            return episodeCount;
        }
    }

    return null;
};

// User episode confirmation prompt
const promptUserForEpisodeNumber = (animeTitle: string, detectedEpisode: number = 1): Promise<number | null> => {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement("div");
        overlay.className = "anime-list-ext-overlay";

        // Create prompt dialog
        const prompt = document.createElement("div");
        prompt.className = "anime-list-ext-episode-prompt";

        prompt.innerHTML = `
            <h3>🎬 Add "${animeTitle}" to Watch List</h3>
            <p>What episode are you currently watching?</p>
            <div>
                Episode: <input type="number" id="episode-input" value="${detectedEpisode}" min="1" max="9999">
            </div>
            <div class="anime-list-ext-prompt-buttons">
            </div>
        `;

        const buttonsContainer = prompt.querySelector(".anime-list-ext-prompt-buttons");

        // Confirm button
        const confirmBtn = createButton("✓ Add & Start Tracking", "episode", () => {
            const input = prompt.querySelector("#episode-input") as HTMLInputElement;
            const episodeNumber = parseInt(input.value, 10);

            if (episodeNumber && episodeNumber > 0) {
                cleanup();
                resolve(episodeNumber);
            } else {
                // Shake animation for invalid input
                input.style.borderColor = "#ef4444";
                input.style.animation = "shake 0.5s";
                setTimeout(() => {
                    input.style.borderColor = "#8b5cf6";
                    input.style.animation = "";
                }, 500);
            }
        });

        // Cancel button
        const cancelBtn = createButton("Cancel", "remove", () => {
            cleanup();
            resolve(null);
        });

        buttonsContainer?.appendChild(confirmBtn);
        buttonsContainer?.appendChild(cancelBtn);

        const cleanup = () => {
            overlay.remove();
            prompt.remove();
        };

        // Close on overlay click
        overlay.addEventListener("click", () => {
            cleanup();
            resolve(null);
        });

        // Close on Escape key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                cleanup();
                resolve(null);
                document.removeEventListener("keydown", handleKeyDown);
            } else if (e.key === "Enter") {
                confirmBtn.click();
                document.removeEventListener("keydown", handleKeyDown);
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        // Focus input after a brief delay
        setTimeout(() => {
            const input = prompt.querySelector("#episode-input") as HTMLInputElement;
            input?.focus();
            input?.select();
        }, 100);

        document.body.appendChild(overlay);
        document.body.appendChild(prompt);
    });
};

// Check if anime is already being tracked
const isAnimeBeingTracked = async (animeId: string): Promise<boolean> => {
    try {
        const progress = await getEpisodeProgress(animeId);
        return progress !== null;
    } catch (error) {
        console.error("Failed to check if anime is tracked:", error);
        showNotification("❌ Could not check anime status.", 3000);
        return false; // Assume not tracked if storage fails
    }
};

// Create "Add to Watch List" button for untracked anime
const createAddToWatchListButton = (watchData: any) => {
    const container = document.createElement("div");
    container.className = "anime-list-ext-episode-tracker";

    const titleDiv = document.createElement("div");
    titleDiv.className = "anime-list-ext-episode-title";
    titleDiv.textContent = watchData.animeTitle;

    const infoDiv = document.createElement("div");
    infoDiv.className = "anime-list-ext-episode-info";
    infoDiv.textContent = "Not tracking episodes yet";

    const addBtn = createButton("📝 Add to Watch List", "add", async () => {
        // Try to detect episode number from title
        const detectedEpisode = detectEpisodeFromTitle();

        // Ask user to confirm episode number
        const confirmedEpisode = await promptUserForEpisodeNumber(watchData.animeTitle, detectedEpisode);

        if (confirmedEpisode !== null) {
            try {
                // Save episode mapping
                if (watchData.episodeId) {
                    const mapping: EpisodeMapping = {
                        animeId: watchData.animeId,
                        episodeId: watchData.episodeId,
                        episodeNumber: confirmedEpisode,
                        animeSlug: watchData.animeSlug,
                        url: window.location.href,
                        detectedAt: new Date().toISOString(),
                    };
                    await saveEpisodeMapping(mapping);
                }

                // Save episode progress
                const progressData: EpisodeProgress = {
                    animeId: watchData.animeId,
                    animeTitle: watchData.animeTitle,
                    animeSlug: watchData.animeSlug,
                    currentEpisode: confirmedEpisode,
                    episodeId: watchData.episodeId,
                    lastWatched: new Date().toISOString(),
                    totalEpisodes: detectTotalEpisodes() || undefined,
                };

                await saveEpisodeProgress(progressData);

                // Replace the add button with the full episode tracker
                container.remove();
                const tracker = await createEpisodeTracker(watchData);
                document.body.appendChild(tracker);
            } catch (error) {
                console.error("Failed to save initial progress:", error);
                showNotification("❌ Error saving progress. Please try again.", 5000);
            }
        }
    });

    container.appendChild(titleDiv);
    container.appendChild(infoDiv);
    container.appendChild(addBtn);

    return container;
};

// Helper function to detect episode number from title only
const detectEpisodeFromTitle = (): number => {
    const titleElement = document.querySelector("title");
    if (titleElement) {
        const titleText = titleElement.textContent || "";
        console.log("Trying to detect episode from title:", titleText);

        // Try multiple, more specific patterns for episode detection
        const patterns = [
            /(?:episode|ep|ep\.)\s*(\d+)/i, // "Episode 4", "Ep 4", "Ep. 4"
            /-\s*(\d+)\s*$/, // "Anime Title - 04"
            /\s+(\d+)$/, // "Anime Title 4" (at the very end)
        ];

        for (const pattern of patterns) {
            const match = titleText.match(pattern);
            if (match && match[1]) {
                const episodeNumber = parseInt(match[1], 10);
                // Sanity check - episode numbers should be reasonable
                if (episodeNumber >= 1 && episodeNumber <= 9999) {
                    console.log("Detected episode number:", episodeNumber, "using pattern:", pattern);
                    return episodeNumber;
                }
            }
        }

        console.log("Could not detect episode number from title using specific patterns.");
    }
    return 1; // Default to 1 if no specific pattern matches
};

// Get all episode progress data
const getAllEpisodeProgress = (): Promise<EpisodeProgress[]> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("episodes", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage Error (getAllEpisodeProgress):", chrome.runtime.lastError);
                return reject(chrome.runtime.lastError);
            }
            resolve(data.episodes || []);
        });
    });
};

// Enhanced episode tracker with URL-first detection
const createEpisodeTracker = async (watchData: any): Promise<HTMLElement> => {
    // Use enhanced URL-first episode detection
    const episodeData = await detectEpisodeFromUrl();
    const episodeNumber = episodeData.episodeNumber;
    const episodeId = episodeData.episodeId;

    const totalEpisodes = detectTotalEpisodes();
    let existingProgress: EpisodeProgress | null = null;
    try {
        existingProgress = await getEpisodeProgress(watchData.animeId);
    } catch (error) {
        console.error("Failed to get existing progress for tracker:", error);
        showNotification("❌ Could not load progress.", 3000);
    }

    const tracker = document.createElement("div");
    tracker.className = "anime-list-ext-episode-tracker";

    const titleDiv = document.createElement("div");
    titleDiv.className = "anime-list-ext-episode-title";
    titleDiv.textContent = watchData.animeTitle;

    const infoDiv = document.createElement("div");
    infoDiv.className = "anime-list-ext-episode-info";

    // Container for episode number input
    const episodeControlDiv = document.createElement("div");
    episodeControlDiv.style.display = "flex";
    episodeControlDiv.style.alignItems = "center";
    episodeControlDiv.style.gap = "8px";
    episodeControlDiv.style.marginBottom = "8px";

    const episodeLabel = document.createElement("span");
    episodeLabel.textContent = "Episode:";

    const episodeInput = document.createElement("input");
    episodeInput.type = "number";
    episodeInput.value = String(episodeNumber);
    episodeInput.min = "1";
    episodeInput.className = "anime-list-ext-episode-input"; // Add class
    episodeInput.style.width = "70px";
    episodeInput.style.padding = "4px 8px";
    episodeInput.style.borderRadius = "4px";
    episodeInput.style.border = "1px solid #8b5cf6";
    episodeInput.style.background = "rgba(255,255,255,0.1)";
    episodeInput.style.color = "white";
    episodeInput.style.textAlign = "center";
    episodeInput.style.fontSize = "14px";

    const episodeTitleSpan = document.createElement("div");
    episodeTitleSpan.className = "anime-list-ext-episode-title-span";
    episodeTitleSpan.style.fontSize = "12px";
    episodeTitleSpan.style.opacity = "0.8";
    episodeTitleSpan.style.marginTop = "4px";
    episodeTitleSpan.style.fontStyle = "italic";

    episodeControlDiv.appendChild(episodeLabel);
    episodeControlDiv.appendChild(episodeInput);
    episodeControlDiv.appendChild(episodeTitleSpan);

    const totalEpisodesSpan = document.createElement("span");
    totalEpisodesSpan.className = "anime-list-ext-total-episodes"; // Add class
    if (totalEpisodes) {
        totalEpisodesSpan.textContent = `of ${totalEpisodes}`;
    }
    episodeControlDiv.appendChild(totalEpisodesSpan);

    const lastWatchedDiv = document.createElement("div");
    lastWatchedDiv.style.fontSize = "12px";
    lastWatchedDiv.style.opacity = "0.8";

    if (existingProgress) {
        lastWatchedDiv.textContent = `Last watched: Ep ${existingProgress.currentEpisode}`;
    }

    infoDiv.appendChild(episodeControlDiv);
    infoDiv.appendChild(lastWatchedDiv);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "anime-list-ext-button-container";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "8px";
    buttonContainer.style.marginTop = "8px";

    const prevBtn = createButton("⬅️ Prev", "episode", () => {});
    prevBtn.disabled = true; // Initially disabled
    prevBtn.className += " anime-list-ext-prev-btn"; // Add class for selection

    const nextBtn = createButton("Next ➡️", "episode", () => {});
    nextBtn.disabled = true; // Initially disabled
    nextBtn.className += " anime-list-ext-next-btn"; // Add class for selection

    buttonContainer.appendChild(prevBtn);
    buttonContainer.appendChild(nextBtn);

    const markBtn = createButton(`✓ Mark Episode ${episodeNumber} Watched`, "episode", async () => {
        const manualEpisodeNumber = parseInt(episodeInput.value, 10);
        if (isNaN(manualEpisodeNumber) || manualEpisodeNumber <= 0) {
            showNotification("❌ Invalid episode number.", 3000);
            return;
        }

        const progressData: EpisodeProgress = {
            animeId: watchData.animeId,
            animeTitle: watchData.animeTitle,
            animeSlug: watchData.animeSlug,
            currentEpisode: manualEpisodeNumber,
            episodeId: episodeId || watchData.episodeId,
            lastWatched: new Date().toISOString(),
            totalEpisodes: totalEpisodes || undefined,
        };

        try {
            await saveEpisodeProgress(progressData);
            markBtn.textContent = "✓ Marked as Watched";
            markBtn.style.opacity = "0.7";
            markBtn.disabled = true;

            // Update info to show progress
            let completionText = `Episode ${manualEpisodeNumber} ✓`;
            if (totalEpisodes) {
                completionText += ` (${manualEpisodeNumber}/${totalEpisodes})`;
                if (manualEpisodeNumber === totalEpisodes) {
                    completionText += " - COMPLETED! 🎉";
                }
            }
            episodeControlDiv.innerHTML = completionText;

            lastWatchedDiv.textContent = `Watched on ${new Date().toLocaleDateString()}`;
            showNotification(`Marked episode ${manualEpisodeNumber} as watched.`, 3000);
        } catch (error) {
            console.error("Failed to save progress on mark:", error);
            showNotification("❌ Error saving progress.", 4000);
        }
    });

    episodeInput.addEventListener("input", () => {
        const manualEpisodeNumber = parseInt(episodeInput.value, 10);
        if (!isNaN(manualEpisodeNumber) && manualEpisodeNumber > 0) {
            markBtn.textContent = `✓ Mark Episode ${manualEpisodeNumber} Watched`;
            markBtn.disabled = existingProgress ? existingProgress.currentEpisode >= manualEpisodeNumber : false;
            markBtn.style.opacity = markBtn.disabled ? "0.7" : "1";
        }
    });

    // If this episode is already marked as watched, disable the button
    if (existingProgress && existingProgress.currentEpisode >= episodeNumber) {
        markBtn.textContent = "✓ Already Watched";
        markBtn.style.opacity = "0.7";
        markBtn.disabled = true;
    }

    const stopBtn = createButton("🛑 Stop Tracking", "danger", async () => {
        const confirmed = window.confirm(
            `Are you sure you want to stop tracking "${watchData.animeTitle}"? This will remove all progress and episode mappings.`,
        );
        if (confirmed) {
            try {
                await removeEpisodeProgress(watchData.animeId);
                await removeAllEpisodeMappings(watchData.animeId);
                tracker.remove(); // Remove the tracker from the page
                // Show the "Add to Watch List" button again
                const addButton = createAddToWatchListButton(watchData);
                document.body.appendChild(addButton);
                showNotification(`Stopped tracking ${watchData.animeTitle}`, 3000);
            } catch (error) {
                console.error("Failed to stop tracking:", error);
                showNotification("❌ Error stopping tracking.", 4000);
            }
        }
    });
    stopBtn.style.marginTop = "8px";

    tracker.appendChild(titleDiv);
    tracker.appendChild(infoDiv);
    tracker.appendChild(buttonContainer);
    tracker.appendChild(markBtn);
    tracker.appendChild(stopBtn);

    // Wait for the dynamic episode list to load and enhance the tracker
    waitForEpisodeListAndEnhanceTracker(tracker, watchData.animeId);

    return tracker;
};

const waitForEpisodeListAndEnhanceTracker = (tracker: HTMLElement, animeId: string) => {
    const observer = new MutationObserver((mutations, obs) => {
        const episodeList = document.querySelector(".ep-list");
        if (episodeList) {
            console.log("Episode list found!");
            const episodeInfo = detectEpisodeFromList(episodeList);
            console.log("Detected episode info:", episodeInfo);

            if (episodeInfo) {
                // Update total episodes
                const totalEpisodesSpan = tracker.querySelector(".anime-list-ext-total-episodes") as HTMLSpanElement;
                if (totalEpisodesSpan && episodeInfo.totalEpisodes) {
                    totalEpisodesSpan.textContent = `of ${episodeInfo.totalEpisodes}`;
                }

                // Update episode title
                const episodeTitleSpan = tracker.querySelector(".anime-list-ext-episode-title-span") as HTMLDivElement;
                if (episodeTitleSpan && episodeInfo.currentEpisodeTitle) {
                    episodeTitleSpan.textContent = `- ${episodeInfo.currentEpisodeTitle}`;
                }

                // Update Prev button
                const prevBtn = tracker.querySelector(".anime-list-ext-prev-btn") as HTMLButtonElement;
                if (prevBtn) {
                    if (episodeInfo.prevEpisodeUrl) {
                        prevBtn.disabled = false;
                        prevBtn.onclick = () => {
                            window.location.href = episodeInfo.prevEpisodeUrl!;
                        };
                    } else {
                        prevBtn.disabled = true;
                    }
                }

                // Update Next button
                const nextBtn = tracker.querySelector(".anime-list-ext-next-btn") as HTMLButtonElement;
                if (nextBtn) {
                    if (episodeInfo.nextEpisodeUrl) {
                        nextBtn.disabled = false;
                        nextBtn.onclick = () => {
                            window.location.href = episodeInfo.nextEpisodeUrl!;
                        };
                    } else {
                        nextBtn.disabled = true;
                    }
                }

                // Update the episode input if it's different
                const episodeInput = tracker.querySelector(".anime-list-ext-episode-input") as HTMLInputElement;
                if (
                    episodeInput &&
                    episodeInfo.currentEpisodeNumber &&
                    episodeInput.value !== String(episodeInfo.currentEpisodeNumber)
                ) {
                    episodeInput.value = String(episodeInfo.currentEpisodeNumber);
                    // Also update storage
                    updateEpisodeNumber(animeId, episodeInfo.currentEpisodeNumber);
                }
            }

            // Mark watched episodes in the list
            markWatchedEpisodesInList(animeId, episodeList);

            obs.disconnect(); // Stop observing once the element is found and processed
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

const markWatchedEpisodesInList = async (animeId: string, episodeListElement: Element) => {
    try {
        const progress = await getEpisodeProgress(animeId);
        if (!progress) return;

        const watchedEpisodeNumber = progress.currentEpisode;
        const episodeItems = episodeListElement.querySelectorAll("li a");

        episodeItems.forEach((item) => {
            const episodeNumberMatch = item.textContent?.match(/(\d+)/);
            if (episodeNumberMatch) {
                const episodeNumber = parseInt(episodeNumberMatch[1], 10);
                if (episodeNumber <= watchedEpisodeNumber) {
                    item.closest("li")?.classList.add("anime-list-ext-watched-episode");
                }
            }
        });
    } catch (error) {
        console.error("Failed to mark watched episodes:", error);
    }
};

const updateEpisodeNumber = async (animeId: string, newEpisodeNumber: number) => {
    // Update the episode number in both storage and UI
    try {
        const progress = await getEpisodeProgress(animeId);
        if (progress) {
            progress.currentEpisode = newEpisodeNumber;
            await saveEpisodeProgress(progress);

            // Update any visible trackers
            const trackers = document.querySelectorAll(".anime-list-ext-episode-tracker");
            trackers.forEach((tracker) => {
                const episodeInput = tracker.querySelector(".anime-list-ext-episode-input") as HTMLInputElement;
                if (episodeInput) {
                    episodeInput.value = String(newEpisodeNumber);
                }

                const totalEpisodes = detectTotalEpisodes();
                const totalEpisodesSpan = tracker.querySelector(".anime-list-ext-total-episodes") as HTMLSpanElement;
                if (totalEpisodesSpan) {
                    totalEpisodesSpan.textContent = totalEpisodes ? `of ${totalEpisodes}` : "";
                }
            });
        }
    } catch (error) {
        console.error("Failed to update episode number:", error);
    }
};

// This function parses the dynamically loaded episode list to find
// the current episode's title, and the URLs for the previous and next episodes.
const detectEpisodeFromList = (
    episodeListElement: Element,
): {
    currentEpisodeNumber: number | null;
    currentEpisodeTitle: string | null;
    prevEpisodeUrl: string | null;
    nextEpisodeUrl: string | null;
    totalEpisodes: number | null;
} | null => {
    const currentEpisodeItem = episodeListElement.querySelector("li a.active");
    if (!currentEpisodeItem) return null;

    const currentLi = currentEpisodeItem.closest("li");
    if (!currentLi) return null;

    const episodeNumberMatch = currentEpisodeItem.textContent?.match(/(\d+)/);
    const currentEpisodeNumber = episodeNumberMatch ? parseInt(episodeNumberMatch[1], 10) : null;

    const episodeTitleSpan = currentLi.querySelector(".ep-title") as HTMLElement;
    const currentEpisodeTitle = episodeTitleSpan ? episodeTitleSpan.innerText : null;

    const prevLi = currentLi.previousElementSibling;
    const nextLi = currentLi.nextElementSibling;

    const prevEpisodeUrl = prevLi ? (prevLi.querySelector("a")?.href ?? null) : null;
    const nextEpisodeUrl = nextLi ? (nextLi.querySelector("a")?.href ?? null) : null;

    const allEpisodes = episodeListElement.querySelectorAll("li a");
    const totalEpisodes = allEpisodes.length > 0 ? allEpisodes.length : null;

    return {
        currentEpisodeNumber,
        currentEpisodeTitle,
        prevEpisodeUrl,
        nextEpisodeUrl,
        totalEpisodes,
    };
};

// This function adds a "Continue Watching" section to the homepage,
// allowing users to quickly jump back to their last watched episode.
const addContinueWatchingSection = async () => {
    const container = document.createElement("div");
    container.className = "anime-list-ext-continue-watching";

    const title = document.createElement("h3");
    title.className = "anime-list-ext-section-title";
    title.textContent = "Continue Watching";

    container.appendChild(title);

    // Get all episode progress data
    const allProgress = await getAllEpisodeProgress();

    if (allProgress.length > 0) {
        // Sort by last watched date (newest first)
        allProgress.sort((a, b) => {
            return new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime();
        });

        // Limit to 5 items for the continue watching section
        const recentProgress = allProgress.slice(0, 5);

        recentProgress.forEach((progress) => {
            const item = document.createElement("div");
            item.className = "anime-list-ext-continue-item";

            const info = document.createElement("div");
            info.className = "anime-list-ext-continue-info";

            const animeTitle = document.createElement("div");
            animeTitle.className = "anime-list-ext-continue-anime";
            animeTitle.textContent = progress.animeTitle;

            const episodeInfo = document.createElement("div");
            episodeInfo.className = "anime-list-ext-continue-episode";
            episodeInfo.textContent = `Ep ${progress.currentEpisode}`;

            info.appendChild(animeTitle);
            info.appendChild(episodeInfo);

            const watchButton = createButton("▶️ Watch", "episode", () => {
                // Navigate to the watch page for this anime and episode
                window.location.href = `https://hianime.to/watch/${progress.animeSlug}?ep=${progress.episodeId}`;
            });

            item.appendChild(info);
            item.appendChild(watchButton);

            container.appendChild(item);
        });

        // Add a "See All" button to navigate to the full list of tracked anime
        const seeAllButton = createButton("📜 See All", "add", () => {
            window.location.href = "/user/anime-list"; // Adjust this URL to the actual anime list page
        });
        seeAllButton.style.marginTop = "12px";
        container.appendChild(seeAllButton);
    } else {
        const message = document.createElement("div");
        message.className = "anime-list-ext-no-progress";
        message.textContent = "No tracked episodes to display.";
        container.appendChild(message);
    }

    // Insert the continue watching section at the top of the homepage
    const homepageContent = document.querySelector(".homepage-content");
    if (homepageContent) {
        homepageContent.insertBefore(container, homepageContent.firstChild);
    }
};

// This function adds a tracking button to each anime item on listing pages.
const addTrackingButtonsToListing = async () => {
    const allAnimeItems = document.querySelectorAll(".flw-item");

    for (const item of allAnimeItems) {
        const animeId = item.getAttribute("data-id");
        const animeTitle = item.querySelector(".film-name")?.textContent?.trim();
        const animeSlug = item.querySelector("a")?.getAttribute("href")?.split("/").pop();

        if (animeId && animeTitle && animeSlug) {
            const buttonWrapper = document.createElement("div");
            buttonWrapper.className = "anime-list-ext-wrapper";
            item.appendChild(buttonWrapper);

            const isTracked = await isAnimeBeingTracked(animeId);

            if (isTracked) {
                const progress = await getEpisodeProgress(animeId);
                const episodeNumber = progress ? progress.currentEpisode : 1;

                const continueBtn = createButton(`▶️ Continue Ep ${episodeNumber}`, "episode", () => {
                    if (progress) {
                        window.location.href = `https://hianime.to/watch/${progress.animeSlug}?ep=${progress.episodeId}`;
                    } else {
                        window.location.href = `https://hianime.to/watch/${animeSlug}`;
                    }
                });
                buttonWrapper.appendChild(continueBtn);

                if (progress) {
                    const progressIndicator = document.createElement("div");
                    progressIndicator.className = "anime-list-ext-progress-indicator";
                    progressIndicator.textContent = `Ep ${progress.currentEpisode}`;
                    item.appendChild(progressIndicator);
                }
            } else {
                const addBtn = createButton("📝 Add to Watch List", "add", async () => {
                    const confirmedEpisode = await promptUserForEpisodeNumber(animeTitle, 1);

                    if (confirmedEpisode !== null) {
                        try {
                            const progressData: EpisodeProgress = {
                                animeId,
                                animeTitle,
                                animeSlug,
                                currentEpisode: confirmedEpisode,
                                episodeId: "", // Will be determined on the watch page
                                lastWatched: new Date().toISOString(),
                                totalEpisodes: undefined,
                            };
                            await saveEpisodeProgress(progressData);

                            showNotification(`Added "${animeTitle}" to your watch list.`, 3000);
                            addBtn.remove();
                            const continueBtn = createButton(`▶️ Continue Ep ${confirmedEpisode}`, "episode", () => {
                                window.location.href = `https://hianime.to/watch/${animeSlug}`;
                            });
                            buttonWrapper.appendChild(continueBtn);
                        } catch (error) {
                            console.error("Failed to save initial progress from listing:", error);
                            showNotification("❌ Error adding to list.", 5000);
                        }
                    }
                });
                buttonWrapper.appendChild(addBtn);
            }
        }
    }
};

// Main execution logic
const main = async () => {
    console.log("Anime List Extension: Main script running...");
    injectStyles();

    // Use a more robust check for page changes in single-page applications
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            runPageLogic();
        }
    }).observe(document, { subtree: true, childList: true });

    runPageLogic();
};

const runPageLogic = async () => {
    // Remove any existing trackers or buttons before running logic again
    document.querySelectorAll(".anime-list-ext-episode-tracker, .anime-list-ext-wrapper").forEach((el) => el.remove());

    if (isWatchPage()) {
        console.log("Watch page detected.");
        const watchData = parseWatchUrl();
        const animeId = watchData.animeId;

        if (!animeId) {
            console.log("Could not determine Anime ID. Aborting.");
            showNotification("⚠️ Could not identify this anime. Tracking disabled.", 4000);
            return;
        }

        try {
            const isTracked = await isAnimeBeingTracked(animeId);

            if (isTracked) {
                const tracker = await createEpisodeTracker(watchData);
                document.body.appendChild(tracker);
            } else {
                const addButton = createAddToWatchListButton(watchData);
                document.body.appendChild(addButton);
            }
        } catch (error) {
            console.error("Error during watch page setup:", error);
            showNotification("❌ An error occurred. Please refresh the page.", 5000);
        }
    } else if (isListingPage()) {
        console.log("Listing page detected.");
        addTrackingButtonsToListing();
        addContinueWatchingSection(); // Also add continue watching on listing pages
    } else {
        console.log("Neither watch nor listing page detected.");
        // Potentially add continue watching to other pages like the homepage
        if (window.location.pathname === "/") {
            addContinueWatchingSection();
        }
    }
};

main().catch((error) => {
    console.error("Anime List Extension: A critical error occurred in main function:", error);
});
