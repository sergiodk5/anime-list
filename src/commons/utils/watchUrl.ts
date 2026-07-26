import type { EpisodeProgress } from "@/commons/models";

// anichi.to's single per-anime player URL shape (see WATCH_PATH_RE in
// src/content/adapters/anichi.ts). Duplicated here rather than imported —
// commons must not depend on content-script code. Real site hrefs carry no
// trailing slash, so none is generated.
const WATCH_BASE_URL = "https://anichi.to/watch";

/**
 * Build the "continue watching" URL for a tracked anime — the player page of
 * the episode the user is currently on (currentEpisode is the last watched
 * episode, not the next one).
 */
export function getContinueWatchingUrl(item: EpisodeProgress): string {
    return `${WATCH_BASE_URL}/${item.animeSlug}/ep-${item.currentEpisode}`;
}
