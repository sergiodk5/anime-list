console.log("Hello from content script!");

const createButton = (text: string, color: string, callback: () => void) => {
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

const createWrapper = () => {
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.right = "0";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.alignItems = "center";
    wrapper.style.zIndex = "1000";
    wrapper.style.backgroundColor = "rgba(0,0,0,0.5)";
    wrapper.style.padding = "10px";

    return wrapper;
};

const actionButtons = () => {
    const wrapper = createWrapper();

    const buttonAdd = createButton("Add", "green", () => {
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

    const buttonRemove = createButton("Remove", "red", () => {
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
    const wrapper = document.querySelector(".film_list-wrap");
    if (!wrapper) return;

    const films = wrapper.querySelectorAll(".flw-item");
    const cleanUpStorage = createButton("Delete storage", "red", () => {
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
