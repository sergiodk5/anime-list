import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import WatchingAnimeCard from "@/options/components/watching/WatchingAnimeCard.vue";

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
});
