import {
    checkUpdate,
    installUpdate,
    onUpdaterEvent,
} from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
import { toast } from 'svelte-sonner'
import { Store } from "tauri-plugin-store-api";
import { Octokit } from "octokit";

const config = new Store(".config.dat");

export const tauriUpdater = async () => {
    await config.set("new_update", false);
    await config.save();
    
    const unlisten = await onUpdaterEvent(({ error, status }) => {
        // This will log all updater events, including status updates and errors.
        console.log('Updater event', error, status)
    })

    try {
        const { shouldUpdate, manifest } = await checkUpdate()

        await config.set("new_update", true);
        await config.save();

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
    await config.set("new_update", false);
    await config.save();
    await installUpdate()
    await relaunch()
}

export const getGithubInfo = async () => {
    const octokit = new Octokit();

    const user = "rumrobot";
    const repo = "pavlov-map-manager";

    const githubResp = await octokit.request(`GET /repos/${user}/${repo}/releases/latest`);
    console.log(githubResp.data);
    return githubResp.data;
}