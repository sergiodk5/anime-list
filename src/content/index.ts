/**
 * AnimeList Content Script - Modular Architecture Entry Point
 *
 * This script initializes the application's content controllers,
 * injecting dependencies like services and UI components.
 */

import { AnimeService } from "@/commons/services";
import { ToastSystem } from "./components/ui/ToastSystem";
import { ContentController } from "./controllers/ContentController";
import { ListPageController } from "./controllers/ListPageController";
import { SinglePageController } from "./controllers/SinglePageController";

(async () => {
    console.log("AnimeList content script loaded");

    // Instantiate shared services and UI systems
    const animeService = new AnimeService();
    const toastSystem = ToastSystem.getInstance();

    // Instantiate page-specific controllers with dependencies
    const singlePageController = SinglePageController.getInstance(animeService, toastSystem);
    const listPageController = ListPageController.getInstance(animeService, toastSystem);

    // Instantiate the main content controller with page-specific controllers
    const contentController = ContentController.getInstance(singlePageController, listPageController);

    // Initialize the application
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => contentController.initialize());
    } else {
        contentController.initialize();
    }

    // Extension initialization complete
    console.log("AnimeList content script initialization complete");
})();
