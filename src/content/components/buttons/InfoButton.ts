import type { AnimeData } from "../../types/ContentTypes";

/**
 * InfoButton - Modular component for anime info display
 * Provides quick access to anime information and external links
 */
export class InfoButton {
    /**
     * Creates an info button that shows anime details
     */
    static create(animeData: AnimeData): HTMLElement {
        const button = document.createElement("button");
        button.className = "anime-list-info-btn";
        button.setAttribute("data-testid", "anime-info-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `View info for "${animeData.animeTitle}"`);
        button.innerHTML = `
      <span class="button-icon">ℹ️</span>
      <span class="button-text">Anime Info</span>
    `;

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleInfoClick(animeData);
        });

        return button;
    }

    /**
     * Creates a quick stats display (episode count, etc.)
     */
    static createQuickStats(animeData: AnimeData, currentEpisode?: number): HTMLElement {
        const statsDiv = document.createElement("div");
        statsDiv.className = "anime-list-quick-stats";
        statsDiv.setAttribute("data-testid", "anime-quick-stats");

        let statsContent = "";

        if (currentEpisode !== undefined) {
            statsContent += `<span class="stat">Ep: ${currentEpisode}</span>`;
        }

        // Add more stats as available
        // totalEpisodes, year, rating, etc. could be added here

        statsDiv.innerHTML = `
      <div class="stats-display">
        ${statsContent}
      </div>
    `;

        return statsDiv;
    }

    /**
     * Creates external link buttons (MyAnimeList, AniList, etc.)
     */
    static createExternalLinks(animeData: AnimeData): HTMLElement {
        const linksDiv = document.createElement("div");
        linksDiv.className = "anime-list-external-links";
        linksDiv.setAttribute("data-testid", "anime-external-links");

        // Create search links based on anime title
        const searchQuery = encodeURIComponent(animeData.animeTitle);

        const links = [
            {
                name: "MyAnimeList",
                url: `https://myanimelist.net/search/all?q=${searchQuery}`,
                icon: "📊",
            },
            {
                name: "AniList",
                url: `https://anilist.co/search/anime?search=${searchQuery}`,
                icon: "📈",
            },
            {
                name: "Kitsu",
                url: `https://kitsu.io/anime?text=${searchQuery}`,
                icon: "🎭",
            },
        ];

        const linksHtml = links
            .map(
                (link) => `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
         class="external-link" title="View on ${link.name}">
        <span class="link-icon">${link.icon}</span>
        <span class="link-text">${link.name}</span>
      </a>
    `,
            )
            .join("");

        linksDiv.innerHTML = `
      <div class="links-container">
        <div class="links-label">View on:</div>
        <div class="links-list">
          ${linksHtml}
        </div>
      </div>
    `;

        return linksDiv;
    }

    /**
     * Creates a tooltip with anime information
     */
    static createTooltip(animeData: AnimeData, currentEpisode?: number): HTMLElement {
        const tooltip = document.createElement("div");
        tooltip.className = "anime-list-tooltip";
        tooltip.setAttribute("data-testid", "anime-tooltip");

        let episodeInfo = "";
        if (currentEpisode !== undefined) {
            episodeInfo = `<div class="tooltip-episode">Episode: ${currentEpisode}</div>`;
        }

        tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-title">${animeData.animeTitle}</div>
        <div class="tooltip-id">ID: ${animeData.animeId}</div>
        ${episodeInfo}
        <div class="tooltip-slug">Slug: ${animeData.animeSlug}</div>
      </div>
    `;

        return tooltip;
    }

    /**
     * Handles info button click
     */
    private static handleInfoClick(animeData: AnimeData): void {
        // For now, show a simple alert with anime info
        // This could be enhanced to show a modal, tooltip, or navigate to a detail page
        const message = `
      Title: ${animeData.animeTitle}
      ID: ${animeData.animeId}
      Slug: ${animeData.animeSlug}
    `.trim();

        // In a real implementation, this might show a modal or tooltip
        console.log("Anime Info:", message);

        // Could also trigger a custom event for other components to handle
        window.dispatchEvent(
            new CustomEvent("animeInfoRequested", {
                detail: { animeData },
            }),
        );
    }

    /**
     * Creates a hover info card
     */
    static createHoverCard(animeData: AnimeData, currentEpisode?: number): HTMLElement {
        const card = document.createElement("div");
        card.className = "anime-list-hover-card";
        card.setAttribute("data-testid", "anime-hover-card");

        let episodeSection = "";
        if (currentEpisode !== undefined) {
            episodeSection = `
        <div class="card-section">
          <strong>Progress:</strong> Episode ${currentEpisode}
        </div>
      `;
        }

        card.innerHTML = `
      <div class="hover-card-content">
        <div class="card-header">
          <h3 class="card-title">${animeData.animeTitle}</h3>
        </div>
        <div class="card-body">
          ${episodeSection}
          <div class="card-section">
            <strong>ID:</strong> ${animeData.animeId}
          </div>
          <div class="card-section">
            <strong>Slug:</strong> ${animeData.animeSlug}
          </div>
        </div>
      </div>
    `;

        // Initially hidden
        card.style.display = "none";
        card.style.position = "absolute";
        card.style.zIndex = "1000";

        return card;
    }

    /**
     * Attaches hover behavior to show/hide info card
     */
    static attachHoverInfo(triggerElement: HTMLElement, animeData: AnimeData, currentEpisode?: number): void {
        const hoverCard = this.createHoverCard(animeData, currentEpisode);
        document.body.appendChild(hoverCard);

        let hoverTimeout: number | null = null;

        triggerElement.addEventListener("mouseenter", () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);

            const rect = triggerElement.getBoundingClientRect();
            hoverCard.style.top = `${rect.bottom + 5}px`;
            hoverCard.style.left = `${rect.left}px`;
            hoverCard.style.display = "block";
        });

        triggerElement.addEventListener("mouseleave", () => {
            hoverTimeout = window.setTimeout(() => {
                hoverCard.style.display = "none";
            }, 200);
        });

        // Also hide when hovering over the card itself and then leaving
        hoverCard.addEventListener("mouseenter", () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
        });

        hoverCard.addEventListener("mouseleave", () => {
            hoverTimeout = window.setTimeout(() => {
                hoverCard.style.display = "none";
            }, 200);
        });
    }
}
