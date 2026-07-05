import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import WatchingAnimeCard from "@/options/components/watching/WatchingAnimeCard.vue";
import { useWatchingStore } from "@/options/stores/watchingStore";

vi.mock("@/options/stores/watchingStore");

const baseItem: EpisodeProgress = {
    animeId: "attack-on-titan-aaaaa",
    animeTitle: "Attack on Titan",
    animeSlug: "attack-on-titan-aaaaa",
    currentEpisode: 5,
    episodeId: "attack-on-titan-aaaaa-episode-5",
    lastWatched: "2025-01-01T00:00:00.000Z",
    totalEpisodes: 25,
    posterUrl: "https://cdn.anipixcdn.co/thumbnail/aot.jpg",
};

describe("WatchingAnimeCard", () => {
    let mockWatchingStore: {
        incrementEpisode: ReturnType<typeof vi.fn>;
        decrementEpisode: ReturnType<typeof vi.fn>;
        stopWatching: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockWatchingStore = {
            incrementEpisode: vi.fn().mockResolvedValue({ success: true }),
            decrementEpisode: vi.fn().mockResolvedValue({ success: true }),
            stopWatching: vi.fn().mockResolvedValue({ success: true }),
        };
        vi.mocked(useWatchingStore).mockReturnValue(mockWatchingStore as any);
    });

    const mountCard = (item: EpisodeProgress = baseItem) => mount(WatchingAnimeCard, { props: { item } });

    describe("Poster", () => {
        it("should render the poster image when posterUrl is present", () => {
            const wrapper = mountCard();

            const img = wrapper.find('[data-testid="watching-card-poster"]');
            expect(img.exists()).toBe(true);
            expect(img.attributes("src")).toBe(baseItem.posterUrl);
            expect(img.attributes("alt")).toBe(baseItem.animeTitle);
            expect(wrapper.find('[data-testid="watching-card-placeholder"]').exists()).toBe(false);
        });

        it("should render the placeholder when posterUrl is missing", () => {
            const wrapper = mountCard({ ...baseItem, posterUrl: undefined });

            expect(wrapper.find('[data-testid="watching-card-poster"]').exists()).toBe(false);
            const placeholder = wrapper.find('[data-testid="watching-card-placeholder"]');
            expect(placeholder.exists()).toBe(true);
            expect(placeholder.text()).toContain("A");
        });

        it("should fall back to the placeholder when the image fails to load", async () => {
            const wrapper = mountCard();

            await wrapper.find('[data-testid="watching-card-poster"]').trigger("error");

            expect(wrapper.find('[data-testid="watching-card-poster"]').exists()).toBe(false);
            expect(wrapper.find('[data-testid="watching-card-placeholder"]').exists()).toBe(true);
        });

        it("should show the poster again when a new posterUrl arrives after a load failure", async () => {
            const wrapper = mountCard();
            await wrapper.find('[data-testid="watching-card-poster"]').trigger("error");
            expect(wrapper.find('[data-testid="watching-card-placeholder"]').exists()).toBe(true);

            await wrapper.setProps({
                item: { ...baseItem, posterUrl: "https://cdn.anipixcdn.co/thumbnail/backfilled.jpg" },
            });

            const img = wrapper.find('[data-testid="watching-card-poster"]');
            expect(img.exists()).toBe(true);
            expect(img.attributes("src")).toBe("https://cdn.anipixcdn.co/thumbnail/backfilled.jpg");
        });

        it("should uppercase the placeholder initial", () => {
            const wrapper = mountCard({ ...baseItem, animeTitle: "given", posterUrl: undefined });

            expect(wrapper.find('[data-testid="watching-card-placeholder"]').text()).toBe("G");
        });
    });

    describe("Title and Episodes", () => {
        it("should render the anime title", () => {
            const wrapper = mountCard();

            const title = wrapper.find('[data-testid="watching-card-title"]');
            expect(title.text()).toBe("Attack on Titan");
            expect(title.attributes("title")).toBe("Attack on Titan");
        });

        it("should show current and total episodes when totalEpisodes is set", () => {
            const wrapper = mountCard();

            expect(wrapper.find('[data-testid="watching-card-episodes"]').text()).toBe("Ep 5 / 25");
        });

        it("should show a question mark when totalEpisodes is missing", () => {
            const wrapper = mountCard({ ...baseItem, totalEpisodes: undefined });

            expect(wrapper.find('[data-testid="watching-card-episodes"]').text()).toBe("Ep 5 / ?");
        });
    });

    describe("Watch Link", () => {
        it("should link to the continue-watching URL in a new tab", () => {
            const wrapper = mountCard();

            const link = wrapper.find('[data-testid="watching-card-link"]');
            expect(link.attributes("href")).toBe("https://anikototv.to/watch/attack-on-titan-aaaaa/ep-5");
            expect(link.attributes("target")).toBe("_blank");
            expect(link.attributes("rel")).toBe("noopener noreferrer");
        });

        it("should update the link when the current episode changes", async () => {
            const wrapper = mountCard();

            await wrapper.setProps({ item: { ...baseItem, currentEpisode: 6 } });

            expect(wrapper.find('[data-testid="watching-card-link"]').attributes("href")).toBe(
                "https://anikototv.to/watch/attack-on-titan-aaaaa/ep-6",
            );
        });
    });

    describe("Episode Stepper", () => {
        it("should render the decrement and increment buttons with accessible labels", () => {
            const wrapper = mountCard();

            const decrement = wrapper.find('[data-testid="watching-card-decrement"]');
            const increment = wrapper.find('[data-testid="watching-card-increment"]');
            expect(decrement.exists()).toBe(true);
            expect(increment.exists()).toBe(true);
            expect(decrement.attributes("aria-label")).toBe("Previous episode");
            expect(increment.attributes("aria-label")).toBe("Next episode");
        });

        it("should call incrementEpisode with the anime id when the increment button is clicked", async () => {
            const wrapper = mountCard();

            await wrapper.find('[data-testid="watching-card-increment"]').trigger("click");

            expect(mockWatchingStore.incrementEpisode).toHaveBeenCalledTimes(1);
            expect(mockWatchingStore.incrementEpisode).toHaveBeenCalledWith(baseItem.animeId);
        });

        it("should call decrementEpisode with the anime id when the decrement button is clicked", async () => {
            const wrapper = mountCard();

            await wrapper.find('[data-testid="watching-card-decrement"]').trigger("click");

            expect(mockWatchingStore.decrementEpisode).toHaveBeenCalledTimes(1);
            expect(mockWatchingStore.decrementEpisode).toHaveBeenCalledWith(baseItem.animeId);
        });

        it("should disable the decrement button when the current episode is 1", async () => {
            const wrapper = mountCard({ ...baseItem, currentEpisode: 1 });

            const decrement = wrapper.find('[data-testid="watching-card-decrement"]');
            expect(decrement.attributes("disabled")).toBeDefined();

            await decrement.trigger("click");
            expect(mockWatchingStore.decrementEpisode).not.toHaveBeenCalled();
        });

        it("should enable the decrement button when the current episode is above 1", () => {
            const wrapper = mountCard({ ...baseItem, currentEpisode: 2 });

            expect(wrapper.find('[data-testid="watching-card-decrement"]').attributes("disabled")).toBeUndefined();
        });

        it("should disable the increment button when the current episode equals the total", async () => {
            const wrapper = mountCard({ ...baseItem, currentEpisode: 25, totalEpisodes: 25 });

            const increment = wrapper.find('[data-testid="watching-card-increment"]');
            expect(increment.attributes("disabled")).toBeDefined();

            await increment.trigger("click");
            expect(mockWatchingStore.incrementEpisode).not.toHaveBeenCalled();
        });

        it("should enable the increment button when the current episode is below the total", () => {
            const wrapper = mountCard();

            expect(wrapper.find('[data-testid="watching-card-increment"]').attributes("disabled")).toBeUndefined();
        });

        it("should keep the increment button enabled when totalEpisodes is unknown", () => {
            const wrapper = mountCard({ ...baseItem, currentEpisode: 999, totalEpisodes: undefined });

            expect(wrapper.find('[data-testid="watching-card-increment"]').attributes("disabled")).toBeUndefined();
        });
    });

    describe("Remove", () => {
        it("should render the remove button with an accessible label", () => {
            const wrapper = mountCard();

            const remove = wrapper.find('[data-testid="watching-card-remove"]');
            expect(remove.exists()).toBe(true);
            expect(remove.attributes("aria-label")).toBe("Remove Attack on Titan from watching");
        });

        it("should render the remove button over the placeholder when there is no poster", () => {
            const wrapper = mountCard({ ...baseItem, posterUrl: undefined });

            expect(wrapper.find('[data-testid="watching-card-remove"]').exists()).toBe(true);
        });

        it("should call stopWatching with the anime id on a single click without confirmation", async () => {
            const wrapper = mountCard();

            await wrapper.find('[data-testid="watching-card-remove"]').trigger("click");

            expect(mockWatchingStore.stopWatching).toHaveBeenCalledTimes(1);
            expect(mockWatchingStore.stopWatching).toHaveBeenCalledWith(baseItem.animeId);
        });

        it("should reveal on hover or keyboard focus via styling classes", () => {
            const wrapper = mountCard();

            const remove = wrapper.find('[data-testid="watching-card-remove"]');
            expect(remove.classes()).toContain("opacity-0");
            expect(remove.classes()).toContain("group-hover:opacity-100");
            expect(remove.classes()).toContain("focus-visible:opacity-100");
        });
    });
});
