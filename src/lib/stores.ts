import { writable } from 'svelte/store';
import type { ModData, AppData, ServerList } from '$lib/types';
import { Store } from 'tauri-plugin-store-api';

export const persistentStore = new Store(".config.dat");

export const serverList = writable<ServerList>([]);

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

