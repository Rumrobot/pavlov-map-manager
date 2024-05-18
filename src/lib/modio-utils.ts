import Bottleneck from "bottleneck";
import { Store } from "tauri-plugin-store-api";
import { get } from "svelte/store";
import { modsStore, queueStore, appStore } from "$lib/stores";
import { toast } from "svelte-sonner";
import { invoke } from "@tauri-apps/api";
import { removeFile } from "@tauri-apps/api/fs";
import { download } from "tauri-plugin-upload-api";

const config = new Store(".config.dat");
const limiter = new Bottleneck({
    minTime: 100,
});

// Modio API request with request limiting 
export async function modioRequest(
    url: string,
    method: string,
    headers: any = {},
    body?: string
) {
    headers.Authorization = "Bearer " + await config.get("oauth_token");
    headers.Accept = "application/json";

    const response = await limiter.schedule(() =>
        fetch("https://api.mod.io/v1" + url, {
            method: method,
            headers: headers,
            body: body,
        })
    );

    return response;
}

async function downloadQueue() {
    let queue = get(queueStore);
    const app = get(appStore);

    app.downloading = true;
    await downloadMap(queue[0]);
    queue.shift();

    queue = queue;

    if (queue.length > 0) {
        app.queueOnGoing++;
        downloadQueue();
    } else {
        app.queueOnGoing = 1;
        app.initialQueueLength = 0;
        app.downloading = false;
    }

    queueStore.set(queue);
    appStore.set(app);
}

export async function addDownload(mod: string) {
    const mods = get(modsStore);
    let queue = get(queueStore);
    const app = get(appStore);

    if (mods[mod].currentVersion != mods[mod].latestVersion && !queue.includes(mod.toString())) {
        queue.push(mod);
        queue = queue;
        if (app.initialQueueLength == 0) {
            downloadQueue();
        }
        app.initialQueueLength++;
    }

    queueStore.set(queue);
    appStore.set(app);
}


async function downloadMap(mod: string) {
    // Initiate the svelte stores
    const mods = get(modsStore);
    const app = get(appStore);
    const modsPath = await config.get("mods_path");
    const oauthToken = await config.get("oauth_token");

    console.log("Old version: ", mods[mod].currentVersion)
    // Set app data
    app.currentlyDownloading = mods[mod].title;
    app.downloadStatus = "Checking new mod version";
    app.totalSize = 0;
    app.receivedSize = 0;

    appStore.set(app);

    // Get the latest version of the map
    const fileInfoResponse = await modioRequest(
        `/games/3959/mods/${mod}/files/${mods[mod].latestVersion}`,
        "GET"
    );
    if (!fileInfoResponse.ok) {
        toast.error(
            "Error while fetching file info for map: " + mods[mod].title
        );
        app.downloadStatus = "Error fetching file info";
        appStore.set(app);
        return;
    }
    const fileInfo = await fileInfoResponse.json();

    // Set the new total size
    app.totalSize = fileInfo.filesize;

    // Check if the file is infected with a virus
    if (fileInfo.virus_positive == 1) {
        toast.error("Virus detected in map: " + mods[mod].title);
        app.downloadStatus = "Virus detected";
        appStore.set(app);
        return;
    }

    app.downloadStatus = "Downloading";
    appStore.set(app);
    // Download the file
    try {
        const headers = new Map();
        headers.set("Authorization", `Bearer ${oauthToken}`);
        headers.set("Content-Type", "application/x-www-form-urlencoded");
        headers.set("Accept", "application/json");
        headers.set("X-Modio-Platform", "windows");

        await download(
            fileInfo.download.binary_url,
            `${mod}.zip`,
            (progress, total) => {
                app.receivedSize += progress;
                appStore.set(app);
            },
            headers
        );
    } catch (error) {
        toast.error("Error while downloading file");
        console.log("Error while downloading file: ", error);

        app.downloadStatus = "Error downloading file";
        appStore.set(app);
        return;
    }

    // Extract the zip file
    app.downloadStatus = "Extracting the file";
    appStore.set(app);
    try {
        await invoke("extract_zip", {
            zipPath: `${mod}.zip`,
            extractPath: `${modsPath}\\UGC${mod}\\Data`,
        });
        // Remove the zip file after extracting
        await removeFile(`${mod}.zip`);
    } catch (error) {
        // If theres and error while extracting the file, remove the zip file
        toast.error("Error while extracting file");
        console.log("Error while extracting file: ", error);

        await removeFile(`${mod}.zip`);
        app.downloadStatus = "Error extracting file";
        appStore.set(app);
        return;
    }

    // Save the new version number to the taint file
    app.downloadStatus = "Saving the new version number";
    appStore.set(app);
    await invoke("write_text_file", {
        filePath: `${modsPath}\\UGC${mod}\\taint`,
        contents: mods[mod].latestVersion.toString(),
    });
    mods[mod].currentVersion = await getCurrentVersion(mod);

    console.log("New version written: ", mods[mod].currentVersion);
    console.log(mods[mod]);

    app.downloadStatus = "Done";

    modsStore.set(mods);
    appStore.set(app);
    return;
}

async function getCurrentVersion(mod: string) {
    const modsPath = await config.get("mods_path");

    const filePath = `${modsPath}\\UGC${mod}\\taint`;
    let currentVersion: string;
    try {
        currentVersion = await invoke("read_file", {
            filePath: filePath,
        });
    } catch (error) {
        return undefined;
    }

    return currentVersion;
}

export async function getMaps() {
    let mods = get(modsStore);
    const modsPath = await config.get("mods_path");

    await getSubscriptions();

    let localMods: Array<string> = [];
    try {
        localMods = await invoke("ls", { path: modsPath });
    } catch (error) {
        toast.error("Error while reading maps from path: " + modsPath);
        console.log("Error while reading maps from path: ", error);
    }
    console.log(localMods);

    localMods = localMods.filter((map: string) => map.startsWith("UGC"));
    localMods = localMods.map((map: string) => map.split("UGC")[1]);

    console.log(localMods);

    for (const mod of localMods) {
        if (!Object.keys(mods).includes(mod)) {
            const response = await modioRequest(
                `/games/3959/mods/${mod}`,
                "GET"
            );
            if (!response.ok) {
                toast.error("Error while fetching map data for map: " + mod);
                console.log("Error while fetching map data for map: ", mod, " Error: ", response.status);

                // Remove the map from the list if it doesn't exist on mod.io
                mods = Object.fromEntries(
                    Object.entries(mods).filter(([key]) => key != mod)
                );
                continue;
            }
            const data = await response.json();
            assignModData(data);
            mods[data.id].subscribed = false;
        }

        mods[mod].currentVersion = await getCurrentVersion(mod);
        console.log("Read version for mod: ", mod, " Version: ", mods[mod].currentVersion)
    }
    for (let mod of Object.keys(mods)) {
        if (mod == "3853484") {
            console.log(mods[mod])
        }
    }
    modsStore.set(mods);
}

function assignModData(data: any) {
    let mods = get(modsStore);

    mods[data.id] = {};

    mods[data.id].title = data.name;
    mods[data.id].imageUrl = data.logo.thumb_1280x720;
    mods[data.id].modUrl = data.profile_url;

    for (const platform of data.platforms) {
        if (platform.platform == "windows") {
            mods[data.id].latestVersion = platform.modfile_live;
        }
    }
    if (mods[data.id].latestVersion == undefined) {
        mods = Object.fromEntries(
            Object.entries(mods).filter(([key]) => key != data.id)
        );
        modsStore.set(mods);
        return Error;
    }
    modsStore.set(mods);
}

async function getSubscriptions() {
    const mods = get(modsStore);

    let allRead = false;
    let page = 0;

    while (!allRead) {
        const response = await modioRequest(
            `/me/subscribed?game_id=3959&platforms=windows`,
            "GET"
        );
        if (!response.ok) {
            toast.error("Error while fetching subscribed maps");
            console.log("Error while fetching subscribed maps", response.status);
            return;
        }
        const data = await response.json();

        for (const mod of data.data) {
            assignModData(mod);
            mods[mod.id].subscribed = true;
        }

        if (data.result_count == 100) {
            page++;
        } else {
            allRead = true;
        }
    }
    modsStore.set(mods);
}

export async function subscribe(mod: string) {
    const mods = get(modsStore);

    if (mods[mod].subscribed) {
        toast.error("You are already subscribed to map: " + mods[mod].title);
        return;
    }

    const response = await modioRequest(
        `/games/3959/mods/${mod}/subscribe`,
        "POST",
        {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        "include_dependencies=false"
    );
    if (!response.ok) {
        toast.error("Error while subscribing to map: " + mods[mod].title);
        console.log("Error while subscribing to map: ", mod, " Error: ", response.status);

        mods[mod].subscribed = false;
        modsStore.set(mods);
        return;
    }

    mods[mod].subscribed = true;
    modsStore.set(mods);
}

export async function unsubscribe(mod: string) {
    const mods = get(modsStore);

    if (!mods[mod].subscribed) {
        toast.error("You are already unsubscribed to map: " + mods[mod].title);
        return;
    }

    const response = await modioRequest(
        `/games/3959/mods/${mod}/subscribe`,
        "DELETE",
        {
            "Content-Type": "application/x-www-form-urlencoded",
        }
    );
    if (!response.ok) {
        toast.error("Error while unsubscribing from map: " + mods[mod].title);
        console.log("Error while unsubscribing from map: ", mod, " Error: ", response.status);

        mods[mod].subscribed = true;
        modsStore.set(mods);
        return;
    }

    mods[mod].subscribed = false;
    modsStore.set(mods);
}

export async function deleteMod(mod: string) {
    const mods = get(modsStore);

    modsStore.set(Object.fromEntries(
        Object.entries(mods).filter(([key, value]) => key != mod)
    ));

    await invoke("remove_dir", {
        path: `${await config.get("mods_path")}\\UGC${mod}`,
    });
}

export async function changeOauthToken(input: string) {

    if (await testOauthToken()) {
        toast.success("OAuth token set successfully");
    } else {
        toast.error("Invalid OAuth token");
        return;
    }

    await config.set("oauth_token", input);
    await config.save();
    await config.set("avatar_url", await setAvatarUrl());
    await config.save();

    location.reload();
}

export async function testOauthToken(input?: string) {
    let token: string;
    if (!input) {
        token = await config.get("oauth_token");
    } else {
        token = input;
    }

    const response = await limiter.schedule(() =>
        fetch("https://api.mod.io/v1/me", {
            headers: {
                Authorization: "Bearer " + token,
                Accept: "application/json",
            },
        })
    );
    if (!response.ok) {
        toast.error("Invalid OAuth token");
        console.log("Invalid OAuth token: ", response.status);
        return false;
    }
    return true;
}

async function setAvatarUrl() {
    try {
        const response = await modioRequest("/me", "GET");
        const data = await response.json();
        return data.avatar.thumb_100x100;
    } catch (error) {
        console.error("Error:", error);
        return;
    }
}

export async function getModsPath() {
    const userSettings: string = await invoke("read_file", {
        filePath: "C:\\Users\\%user%\\AppData\\Local\\Pavlov\\Saved\\Config\\Windows\\GameUserSettings.ini",
    });

    for (const line of userSettings.split("\n")) {
        if (line.includes("ModDirectory")) {
            let path = line.split("=")[1];

            if (path.length > 1) {
                return path;
            } else {
                path = "C:\\Users\\%user%\\AppData\\Local\\Pavlov\\Saved\\Mods";
                return path;
            }
        }
    }
}