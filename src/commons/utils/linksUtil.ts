import type { EpisodeProgress } from "@/commons/models";

export const getAllEpisodeProgress = (): Promise<EpisodeProgress[]> => {
    return new Promise((resolve) => {
        chrome.storage.local.get("episodeProgress", (data) => {
            if (!data.episodeProgress) {
                resolve([]);
                return;
            }
            const progressData = data.episodeProgress as Record<string, EpisodeProgress>;
            resolve(Object.values(progressData));
        });
    });
};

export const removeEpisodeProgress = (animeId: string): Promise<void> => {
    return new Promise((resolve) => {
        chrome.storage.local.get("episodeProgress", (data) => {
            if (!data.episodeProgress) {
                resolve();
                return;
            }
            const progressData = data.episodeProgress as Record<string, EpisodeProgress>;
            delete progressData[animeId];
            chrome.storage.local.set({ episodeProgress: progressData }, () => {
                resolve();
            });
        });
    });
};
