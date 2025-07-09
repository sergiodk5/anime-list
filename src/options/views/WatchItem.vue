<template>
    <div class="px-4 py-2">
        <button
            class="rounded bg-blue-500 px-2 py-1 text-white"
            @click="editOpen"
        >
            Edit
        </button>

        <div>
            <h1>
                <a
                    :href="url"
                    target="_blank"
                >
                    {{ title }}
                </a>
            </h1>

            <p v-if="malId">
                <a
                    :href="`https://myanimelist.net/anime/${malId}`"
                    target="_blank"
                >
                    MAL: {{ malId }}
                </a>
            </p>
        </div>

        <div
            v-if="isEditing"
            class="mt-2 flex flex-col gap-2"
        >
            <div>
                <label for="title">Title</label>
                <input
                    type="text"
                    v-model="newTitle"
                    id="title"
                />
            </div>

            <div>
                <label for="url">URL</label>
                <input
                    type="text"
                    v-model="newUrl"
                    id="url"
                />
            </div>

            <div>
                <label for="malId">MAL ID</label>
                <input
                    type="number"
                    v-model="newMalId"
                    id="malId"
                />
            </div>

            <button
                class="rounded bg-blue-500 px-2 py-1 text-white"
                @click="editSave"
            >
                Save
            </button>

            <button
                class="rounded bg-red-500 px-2 py-1 text-white"
                @click="editClose"
            >
                Cancel
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Link } from "@/commons/models";
import { onMounted, ref, toRefs, watch } from "vue";

const props = defineProps<{
    title: string;
    url: string;
    malId?: number;
}>();

const { title, url, malId } = toRefs(props);
const newTitle = ref(title.value);
const newUrl = ref(url.value);
const newMalId = ref(malId.value);

const isEditing = ref(false);

const editOpen = () => {
    isEditing.value = true;
};

const editClose = () => {
    isEditing.value = false;
    newTitle.value = title.value;
    newUrl.value = url.value;
    newMalId.value = malId.value;
};

const editSave = () => {
    isEditing.value = false;

    chrome.storage.local.get("links", (data) => {
        let links = data.links;

        if (!links) {
            return;
        }

        if (typeof links === "object") {
            links = Object.values(links);
        }

        const linksArray = links as Link[];

        console.log("data", linksArray);

        const newLinks = linksArray.map((link) => {
            if (link.name === title.value) {
                return {
                    name: newTitle.value,
                    url: newUrl.value,
                    malId: newMalId.value,
                };
            }

            return link;
        });

        chrome.storage.local.set({ links: newLinks });
    });

    title.value = newTitle.value;
    url.value = newUrl.value;
    malId.value = newMalId.value;
};

watch(malId, () => {
    console.log(malId.value);
});

onMounted(() => {
    console.log(title.value);
    console.log(url.value);
    console.log(malId.value);
});
</script>
