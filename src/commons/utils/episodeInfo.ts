import type { NextEpisode } from "@/commons/models";

const MINUTES_PER_DAY = 24 * 60;

/**
 * First known positive total, so AniList's total can win over older guesses
 */
export function resolveTotalEpisodes(...candidates: Array<number | null | undefined>): number | undefined {
    return candidates.find((total): total is number => typeof total === "number" && total > 0);
}

export function formatEpisodeProgress(current: number, total: number | undefined): string {
    return `Ep ${current} / ${total ?? "?"}`;
}

export function formatTimeUntil(airingAtSeconds: number, now: number): string {
    const remainingMs = airingAtSeconds * 1000 - now;
    if (remainingMs <= 0) return "out now";

    const totalMinutes = Math.ceil(remainingMs / 60_000);
    const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
    const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return hours > 0 ? `in ${days}d ${hours}h` : `in ${days}d`;
    if (hours > 0) return minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
    return `in ${minutes}m`;
}

export function formatNextEpisode(next: NextEpisode, now: number): string {
    return `Ep ${next.episode} · ${formatTimeUntil(next.airingAt, now)}`;
}

export function formatAiringDate(next: NextEpisode): string {
    return new Date(next.airingAt * 1000).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
