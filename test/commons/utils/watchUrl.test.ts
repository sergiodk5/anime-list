import { describe, expect, it } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import { getContinueWatchingUrl } from "@/commons/utils/watchUrl";

describe("getContinueWatchingUrl", () => {
    it("should build the anikototv watch URL from slug and current episode", () => {
        const item = { animeSlug: "attack-on-titan", currentEpisode: 5 } as EpisodeProgress;

        expect(getContinueWatchingUrl(item)).toBe("https://anikototv.to/watch/attack-on-titan/ep-5");
    });

    it("should link to the current episode without a trailing slash", () => {
        const item = { animeSlug: "candy-caries-vm1jn", currentEpisode: 1 } as EpisodeProgress;

        expect(getContinueWatchingUrl(item)).toBe("https://anikototv.to/watch/candy-caries-vm1jn/ep-1");
    });
});
