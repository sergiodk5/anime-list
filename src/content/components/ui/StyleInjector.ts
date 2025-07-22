/**
 * Style injection system for the content script
 * Manages CSS injection and ensures styles are only loaded once
 */

export class StyleInjector {
    private static injected = false;

    static injectStyles(): void {
        if (StyleInjector.injected) return;

        const style = document.createElement("style");
        style.setAttribute("data-testid", "anime-list-styles");

        // For now, we'll inline the CSS content directly
        // TODO: This will be replaced with proper CSS imports once build system is updated
        style.textContent = `
            /* AnimeList Chrome Extension Styles - Placeholder */
            /* This will be replaced with actual CSS content in the next step */
            .anime-list-controls { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
        `;

        document.head.appendChild(style);
        StyleInjector.injected = true;
    }

    // Reset method for testing
    static reset(): void {
        StyleInjector.injected = false;
    }
}
