console.log("Hello from content script!");

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
        
        .anime-list-ext-btn:active {
            transform: translateY(0) scale(0.95) !important;
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
    `;
    document.head.appendChild(styleSheet);
};

const createButton = (text: string, variant: "add" | "remove" | "danger", callback: () => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `anime-list-ext-btn anime-list-ext-btn--${variant}`;
    button.addEventListener("click", callback);
    return button;
};

const createWrapper = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "anime-list-ext-wrapper";
    return wrapper;
};

const actionButtons = () => {
    const wrapper = createWrapper();

    const buttonAdd = createButton("Add", "add", () => {
        const link = buttonAdd.parentElement?.parentElement?.querySelector(".film-name a") as HTMLAnchorElement;
        if (!link) return;

        // save the link to local storage
        chrome.storage.local.get("links", (data) => {
            const links = data.links || [];
            const title = {
                name: link.textContent,
                url: link.href,
            };
            if (!links.includes(title)) {
                links.push(title);
                chrome.storage.local.set({ links }, () => {
                    console.log("Link added to storage:", title);
                });
            }
        });
    });
    wrapper.appendChild(buttonAdd);

    const buttonRemove = createButton("Remove", "remove", () => {
        const filmWrapper = buttonRemove.parentElement?.parentElement;
        if (!filmWrapper) return;

        // Get the title to save to local storage
        const title = filmWrapper.querySelector(".film-name a")?.textContent;
        if (title) {
            chrome.storage.local.get("titles", (data) => {
                const titles = data.titles || [];
                if (!titles.includes(title)) {
                    titles.push(title);
                    chrome.storage.local.set({ titles }, () => {
                        console.log("Title added to storage:", title);
                    });
                }
            });
        }

        // Hide the film element
        filmWrapper.style.display = "none";
    });

    wrapper.appendChild(buttonRemove);

    return wrapper;
};

// This function now returns a Promise that resolves with the titles
const getAllTitles = (): Promise<string[]> => {
    return new Promise((resolve) => {
        chrome.storage.local.get("titles", (data) => {
            const titles = data.titles || [];
            resolve(titles);
        });
    });
};

const init = async () => {
    // Inject CSS styles first
    injectStyles();

    const wrapper = document.querySelector(".film_list-wrap");
    if (!wrapper) return;

    const films = wrapper.querySelectorAll(".flw-item");
    const cleanUpStorage = createButton("Delete storage", "danger", () => {
        chrome.storage.local.clear(() => {
            console.log("Storage cleared");
        });
    });

    wrapper.parentElement?.appendChild(cleanUpStorage);

    // Wait for the removed titles to load from storage
    const removedTitles = await getAllTitles();

    films.forEach((item) => {
        const movie = item as HTMLElement;
        movie.style.position = "relative";
        const actionWrapper = actionButtons();
        item.appendChild(actionWrapper);
        const title = movie.querySelector(".film-name a")?.textContent;

        // If the title exists in removedTitles, hide the movie
        if (title && removedTitles.includes(title)) {
            movie.style.display = "none";
        }
    });
};

init();
