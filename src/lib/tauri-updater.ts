import { relaunch } from '@tauri-apps/api/process';
import { installUpdate } from '@tauri-apps/api/updater';
import { Octokit } from "octokit";

export const update = async () => {
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