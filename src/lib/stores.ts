import { writable } from 'svelte/store';
import type { ModData, AppData } from '$lib/types';

export const modsStore = writable<ModData>({});
export const queueStore = writable<string[]>([]);
export const appStore = writable<AppData>({
    loading: false,
    status: "Init",
    downloading: false,
    receivedSize: 0,
    totalSize: 0,
    downloadStatus: "Nothing is downloading",
    currentlyDownloading: "None",
    queueOnGoing: 0,
    initialQueueLength: 0
});

