import type { Link } from "@/commons/models";

export const getAllLinks = (): Promise<Link[]> => {
    return new Promise((resolve) => {
        chrome.storage.local.get("links", (data) => {
            if (!data.links) {
                resolve([]);
            }

            const dataLinks = data.links as Link[];
            const links = Object.values(dataLinks) || [];
            resolve(links);
        });
    });
};
