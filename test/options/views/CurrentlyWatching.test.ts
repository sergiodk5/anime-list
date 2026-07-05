import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { useWatchingStore } from "@/options/stores/watchingStore";
import CurrentlyWatching from "@/options/views/CurrentlyWatching.vue";

vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

vi.mock("@/commons/services/AnimeService");

const sampleItems: EpisodeProgress[] = [
    {
        animeId: "demon-slayer-bbbbb",
        animeTitle: "Demon Slayer",
        animeSlug: "demon-slayer-bbbbb",
        currentEpisode: 12,
        episodeId: "demon-slayer-bbbbb-episode-12",
        lastWatched: "2025-01-02T00:00:00.000Z",
        totalEpisodes: 26,
        posterUrl: "https://cdn.anipixcdn.co/thumbnail/demon-slayer.jpg",
    },
    {
        animeId: "attack-on-titan-aaaaa",
        animeTitle: "Attack on Titan",
        animeSlug: "attack-on-titan-aaaaa",
        currentEpisode: 5,
        episodeId: "attack-on-titan-aaaaa-episode-5",
        lastWatched: "2025-01-01T00:00:00.000Z",
        totalEpisodes: 25,
    },
];

function mockGetAllAnime(currentlyWatching: EpisodeProgress[]): void {
    vi.mocked(AnimeService).mockImplementation(
        () =>
            ({
                getAllAnime: vi.fn().mockResolvedValue({
                    currentlyWatching,
                    planToWatch: [],
                    hiddenAnime: [],
                    totalCount: currentlyWatching.length,
                }),
            }) as any,
    );
}

describe("CurrentlyWatching", () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();

        mockGetAllAnime(sampleItems);
    });

    const mountView = () => mount(CurrentlyWatching, { global: { plugins: [pinia] } });

    describe("Initialization", () => {
        it("should initialize the watching store on mount", async () => {
            mountView();

            const store = useWatchingStore();
            await vi.waitFor(() => expect(store.isInitialized).toBe(true));
        });
    });

    describe("Loading State", () => {
        it("should show skeleton cards while the store is loading", async () => {
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: vi.fn().mockReturnValue(new Promise(() => {})),
                    }) as any,
            );

            const wrapper = mountView();
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true);
            expect(wrapper.findAll('[data-testid="skeleton-card"]').length).toBeGreaterThan(0);
            expect(wrapper.find('[data-testid="watching-header"]').exists()).toBe(false);
        });

        it("should hide the loading state once the store finishes loading", async () => {
            const wrapper = mountView();
            const store = useWatchingStore();

            await vi.waitFor(() => expect(store.isInitialized).toBe(true));
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(false);
            expect(wrapper.find('[data-testid="watching-header"]').exists()).toBe(true);
        });
    });

    describe("Error State", () => {
        it("should show the error state when the store fails to load", async () => {
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: vi.fn().mockRejectedValue(new Error("boom")),
                    }) as any,
            );

            const wrapper = mountView();

            await vi.waitFor(() => expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true));
            expect(wrapper.find('[data-testid="error-state"]').text()).toContain("Unable to Load Data");
            expect(wrapper.find('[data-testid="watching-grid"]').exists()).toBe(false);
        });
    });

    describe("Empty State", () => {
        it("should show the empty state with a link to the site when there are no items", async () => {
            mockGetAllAnime([]);

            const wrapper = mountView();
            const store = useWatchingStore();

            await vi.waitFor(() => expect(store.isInitialized).toBe(true));
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="empty-state"]').text()).toContain("Nothing here yet");
            expect(wrapper.find('[data-testid="watching-grid"]').exists()).toBe(false);

            const link = wrapper.find('[data-testid="empty-state-link"]');
            expect(link.attributes("href")).toBe("https://anikototv.to/");
            expect(link.attributes("target")).toBe("_blank");
            expect(link.attributes("rel")).toBe("noopener noreferrer");
        });
    });

    describe("Watching Grid", () => {
        it("should render one card per seeded item sorted by title", async () => {
            const store = useWatchingStore();
            (store as any).__seed(sampleItems);

            const wrapper = mountView();
            await vi.waitFor(() => expect(store.isInitialized).toBe(true));
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="watching-grid"]').exists()).toBe(true);
            const cards = wrapper.findAll('[data-testid="watching-card"]');
            expect(cards).toHaveLength(2);
            expect(cards[0].text()).toContain("Attack on Titan");
            expect(cards[1].text()).toContain("Demon Slayer");
        });

        it("should show the series count in the page subtitle", async () => {
            const wrapper = mountView();

            await vi.waitFor(() =>
                expect(wrapper.find('[data-testid="page-subtitle"]').text()).toContain("2 series in progress"),
            );
        });

        it("should pass episode progress and watch links through to the cards", async () => {
            const wrapper = mountView();

            await vi.waitFor(() => expect(wrapper.find('[data-testid="watching-grid"]').exists()).toBe(true));

            const episodes = wrapper.findAll('[data-testid="watching-card-episodes"]');
            expect(episodes[0].text()).toBe("Ep 5 / 25");
            expect(episodes[1].text()).toBe("Ep 12 / 26");

            const links = wrapper.findAll('[data-testid="watching-card-link"]');
            expect(links[0].attributes("href")).toBe("https://anikototv.to/watch/attack-on-titan-aaaaa/ep-5");
            expect(links[1].attributes("href")).toBe("https://anikototv.to/watch/demon-slayer-bbbbb/ep-12");
        });

        it("should render the poster image only for items with a posterUrl", async () => {
            const wrapper = mountView();

            await vi.waitFor(() => expect(wrapper.find('[data-testid="watching-grid"]').exists()).toBe(true));

            const cards = wrapper.findAll('[data-testid="watching-card"]');
            // Attack on Titan (first, no posterUrl) → placeholder
            expect(cards[0].find('[data-testid="watching-card-placeholder"]').exists()).toBe(true);
            // Demon Slayer (second, has posterUrl) → poster image
            expect(cards[1].find('[data-testid="watching-card-poster"]').attributes("src")).toBe(
                "https://cdn.anipixcdn.co/thumbnail/demon-slayer.jpg",
            );
        });
    });
});
