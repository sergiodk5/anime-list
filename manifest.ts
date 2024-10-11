const NAME = "Anime List";
const DESCRIPTION = "Your Anime Tool";
const VERSION = "1.0.0";
const ICONS = {
    16: "assets/images/darkness_16x16.png",
    32: "assets/images/darkness_32x32.png",
    48: "assets/images/darkness_48x48.png",
    128: "assets/images/darkness_128x128.png",
};

const manifest: chrome.runtime.ManifestBase = {
    manifest_version: 3,
    name: NAME,
    description: DESCRIPTION,
    version: VERSION,
    action: {
        default_popup: "src/popup/index.html",
        default_icon: ICONS,
    },
    background: {
        service_worker: "src/background/index.js",
    },
    content_scripts: [
        {
            js: ["src/content/index.js"],
            matches: ["<all_urls>"],
        },
    ],
    permissions: ["activeTab", "storage"],
    web_accessible_resources: [
        {
            resources: ["assets/images/*"],
            matches: ["<all_urls>"],
        },
    ],
};

console.log(JSON.stringify(manifest, null, 2));
