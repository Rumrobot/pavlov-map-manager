import { relaunch } from '@tauri-apps/api/process';
import {
    checkUpdate,
    installUpdate,
    onUpdaterEvent,
} from '@tauri-apps/api/updater';
import { Octokit } from "octokit";
import { toast } from 'svelte-sonner';
import { persistentStore } from './stores';

export const tauriUpdater = async () => {
    await persistentStore.set("new_update", false);
    await persistentStore.save();
    
    const unlisten = await onUpdaterEvent(({ error, status }) => {
        // This will log all updater events, including status updates and errors.
    })

    try {
        const { shouldUpdate, manifest } = await checkUpdate()

        await persistentStore.set("new_update", true);
        await persistentStore.save();

        if (shouldUpdate) {
            const updateToast = toast("New update available", {
                duration: 10000,
                action: {
                    label: 'Update and relaunch',
                    onClick: async () => {
                        update();
                    }
                }
            });

        }

    } catch (error) {
        console.error(error)
    }

    // you need to call unlisten if your handler goes out of scope, for example if the component is unmounted.
    unlisten()
}

export const update = async () => {
    await persistentStore.set("new_update", false);
    await persistentStore.save();
    await installUpdate()
    await relaunch()
}

export const getGithubInfo = async () => {
    const octokit = new Octokit();

    const user = "rumrobot";
    const repo = "pavlov-map-manager";

    const githubResp = await octokit.request(`GET /repos/${user}/${repo}/releases/latest`);
    return githubResp.data;
}