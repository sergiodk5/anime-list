export const ANICHI_ORIGIN = "https://anichi.cz";

// The site keeps its name but hops TLDs (anichi.to → anichi.cz), so any TLD is accepted.
const ANICHI_HOST_RE = /(^|\.)anichi\.[a-z]{2,}$/i;

export function isAnichiHost(hostname: string): boolean {
    return ANICHI_HOST_RE.test(hostname);
}
