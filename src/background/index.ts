import { AnimeMetadataService, METADATA_REFRESH_MESSAGE } from "@/commons/services/AnimeMetadataService";

export const REFRESH_ALARM = "anime-metadata-refresh";
export const REFRESH_PERIOD_MINUTES = 30;

let inFlight: Promise<void> | null = null;

export function refreshMetadata(service: AnimeMetadataService = new AnimeMetadataService()): Promise<void> {
    inFlight ??= service
        .refreshDue()
        .then((summary) => console.log("[Background] Metadata refresh:", summary))
        .catch((error) => console.error("[Background] Metadata refresh failed:", error))
        .finally(() => {
            inFlight = null;
        });
    return inFlight;
}

function scheduleAndRefresh(): void {
    chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MINUTES });
    void refreshMetadata();
}

export function registerBackgroundListeners(): void {
    chrome.runtime.onInstalled.addListener(scheduleAndRefresh);
    chrome.runtime.onStartup.addListener(scheduleAndRefresh);

    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === REFRESH_ALARM) {
            void refreshMetadata();
        }
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message?.type === METADATA_REFRESH_MESSAGE) {
            void refreshMetadata();
        }
        return false;
    });
}

registerBackgroundListeners();
