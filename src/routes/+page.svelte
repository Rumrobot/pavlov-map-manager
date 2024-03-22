<script lang="ts">
  import { Button } from "$components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$components/ui/card";
  import { Progress } from "$components/ui/progress";
  import { Tooltip, TooltipTrigger } from "$components/ui/tooltip";
  import TooltipContent from "$components/ui/tooltip/tooltip-content.svelte";
  import { writeBinaryFile, BaseDirectory } from "@tauri-apps/api/fs";
  import { humanFileSize } from "$lib/utils";
  import { invoke } from "@tauri-apps/api/tauri";
  import { ArrowDownToLine, RefreshCcw, Star } from "lucide-svelte";
  import { onMount } from "svelte";
  import { Store } from "tauri-plugin-store-api";
  import Bottleneck from "bottleneck";

  const config = new Store(".config.dat");
  const limiter = new Bottleneck({
    minTime: 100,
  });

  let maps: Array<string> = [];
  let subscriptions: Array<string> = [];
  let map_data: {
    [key: string]: {
      id: string;
      title: string;
      image_url: string;
      new_update: boolean;
      current_version: string;
      latest_version: string;
      subscribed: boolean;
    };
  } = {};
  let oauth_token: string;
  let mods_path: string;
  let all_subscribed: boolean;
  let all_updated: boolean;
  let downloading: boolean = false;
  let received_length: number = 0;
  let content_length: number = 0;
  let progress: number = 0;

  (async () => {
    oauth_token = await config.get("oauth_token");
    mods_path = await config.get("mods_path");
  })();

  async function get_maps() {
    const path = await config.get("mods_path");
    try {
      maps = await invoke("list_dir", { path });
      return maps;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async function api_request(
    url: string,
    method: string,
    headers: any = {},
    body?: string
  ) {
    headers.Authorization = "Bearer " + oauth_token;
    headers.Accept = "application/json";

    const response = await limiter.schedule(() =>
      fetch(url, {
        method: method,
        headers: headers,
        body: body,
      })
    );
    if (!response.ok) {
      console.error("Error while fetching data");
      return;
    }
    return response;
  }

  async function get_map_data(map: string) {
    const response = await api_request(
      `https://api.mod.io/v1/games/3959/mods/${map.split("UGC")[1]}`,
      "GET"
    );
    if (!response.ok) {
      console.error("Error while fetching map data for map " + map);
      return;
    }
    const data = await response.json();

    const file_path = mods_path + "\\" + map + "\\taint";
    const current_version = await invoke("read_file", {
      filePath: file_path,
    });
    let latest_version: string;
    let new_update: boolean;

    const platforms = data.platforms;
    for (const platform of platforms) {
      if (platform.platform == "windows") {
        latest_version = platform.modfile_live;
      }
    }

    if (latest_version != null) {
      if (latest_version != current_version) {
        new_update = true;
      } else {
        new_update = false;
      }
    } else {
      console.error("Error: No windows version found for map " + map);
    }

    return {
      id: map.split("UGC")[1],
      title: data.name,
      image_url: data.logo.thumb_1280x720,
      new_update: new_update,
      current_version: current_version as string,
      latest_version: latest_version,
      subscribed: false,
    };
  }

  async function get_subscriptions() {
    const response = await api_request(
      `https://api.mod.io/v1/me/subscribed`,
      "GET"
    );

    if (!response.ok) {
      console.error("Error while fetching subscribed maps");
      return;
    }
    const data = await response.json();

    for (const map of data.data) {
      if (map.game_id == 3959) {
        subscriptions.push(map.id);
      }
    }
    return subscriptions;
  }

  async function check_subscribed(map: string, subscriptions: Array<string>) {
    for (const subscribed of subscriptions) {
      if (subscribed == map.split("UGC")[1]) {
        return true;
      }
    }
    return false;
  }

  async function subscribe(map: string) {
    const response = await api_request(
      `https://api.mod.io/v1/games/3959/mods/${map}/subscribe`,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      "include_dependencies=false"
    );
    if (!response.ok) {
      return;
    }
    location.reload();
  }

  async function unsubscribe(map: string) {
    const response = await api_request(
      `https://api.mod.io/v1/games/3959/mods/${map}/subscribe`,
      "DELETE",
      {
        "Content-Type": "application/x-www-form-urlencoded",
      }
    );
    if (!response.ok) {
      return;
    }
    location.reload();
  }

  async function download_map(map: string) {
    downloading = true;

    try {
      const response = await fetch(
        `https://getsamplefiles.com/download/zip/sample-1.zip`
      );
      /*const reader = response.body.getReader();
      content_length = +response.headers.get("Content-Length");

      received_length = 0; // received that many bytes at the moment
      let chunks = []; // array of received binary chunks (comprises the body)
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        chunks.push(value);
        received_length += value.length;

        progress = (received_length / content_length) * 100;
      }*/

      const arrayBuffer = await response.arrayBuffer();
      const zipBlob = new Blob([arrayBuffer], { type: "application/zip" });
      const array = new Uint8Array(await zipBlob.arrayBuffer());

      // Write data to file using Tauri's file system API
      await writeBinaryFile({
        path: `${map}.zip`,
        contents: array,
      });

      //write data to file using tauri
      console.log("File saved successfully");
    } catch (error) {
      console.error("Error downloading and saving file:", error);
    }
  }

  async function load() {
    maps = await get_maps();
    subscriptions = await get_subscriptions();
    await Promise.all(
      maps.map(async (map) => {
        map_data[map] = await get_map_data(map);
        map_data[map].subscribed = await check_subscribed(map, subscriptions);
      })
    );
  }

  async function check_all() {
    all_updated = true;
    all_subscribed = true;

    for (const map of maps) {
      if (map_data[map].new_update) {
        all_updated = false;
      }
    }
    for (const map of maps) {
      if (!map_data[map].subscribed) {
        all_subscribed = false;
      }
    }
    return;
  }

  onMount(async () => {
    await load();
    await check_all();
  });
</script>

<div class="flex justify-center items-center m-5">
  {#if maps.length > 0}
    <div class="flex flex-col gap-y-5items-start w-full max-w-6xl">
      <div class="flex items-center flex-col gap-y-1.5">
        <Progress
          value={progress}
          class="w-full {downloading ? '' : 'hidden'}"
        />
        <div
          class="w-full flex flex-row {downloading
            ? 'justify-between'
            : 'justify-end'}"
        >
          <div class="items-center flex {downloading ? '' : 'hidden'}">
            {humanFileSize(received_length)}/{humanFileSize(content_length)}
          </div>
          <div class="flex items-center gap-x-1.5">
            <Tooltip>
              <TooltipTrigger>
                <Button disabled={all_updated}><ArrowDownToLine /></Button>
              </TooltipTrigger>
              <TooltipContent>
                {#if all_updated}
                  All maps are up to date
                {:else}
                  Update all maps
                {/if}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  disabled={all_subscribed}
                  on:click={() => {
                    for (const [_, map] of Object.entries(map_data)) {
                      if (!map.subscribed) {
                        subscribe(map.id);
                      }
                    }
                  }}
                  ><Star fill={all_subscribed ? "bg-primary" : "none"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {#if all_subscribed}
                  You are already subscribed to all maps
                {:else}
                  Subscribe to all maps
                {/if}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button on:click={() => location.reload()}
                  ><RefreshCcw /></Button
                >
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div class="flex flex-col justify-start items-start">
        <div>
          <h2 class="text-xl">New update available</h2>
        </div>
        <div
          class="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {#each Object.entries(map_data) as [_, map]}
            {#if map.new_update}
              <Card class="m-1 items-center text-center">
                <CardHeader>
                  <CardTitle class="text-2xl truncate overflow-ellipsis"
                    >{map.title}</CardTitle
                  >
                </CardHeader>
                <CardContent>
                  <img src={map.image_url} alt={map.title} class="rounded-md" />
                  <div class="mt-1.5 flex flex-row justify-between">
                    {#if map.new_update}
                      <Button
                        on:click={() => download_map(map.id)}
                        class={!map.new_update
                          ? "cursor-not-allowed hover:bg-primary"
                          : ""}
                      >
                        <ArrowDownToLine />
                      </Button>
                    {/if}
                    {#if map.subscribed}
                      <Button on:click={() => unsubscribe(map.id)}>
                        <Star fill="bg-primary" />
                      </Button>
                    {:else}
                      <Button on:click={() => subscribe(map.id)}>
                        <Star fill="none" />
                      </Button>
                    {/if}
                  </div>
                </CardContent>
              </Card>
            {/if}
          {/each}
        </div>
      </div>
      <div class="flex flex-col justify-start items-start">
        <h2 class="text-xl">Up to date</h2>
        <div
          class="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {#each Object.entries(map_data) as [_, map]}
            {#if map.new_update != true}
              <Card class="m-1 items-center text-center">
                <CardHeader>
                  <CardTitle class="text-2xl truncate overflow-ellipsis"
                    >{map.title}</CardTitle
                  >
                </CardHeader>
                <CardContent>
                  <img src={map.image_url} alt={map.title} class="rounded-md" />
                  <div class="mt-1.5 flex flex-row justify-between">
                    <Button on:click={() => subscribe(map.id)}>
                      <Star fill={map.subscribed ? "bg-primary" : "none"} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center flex-col">
      <p class="txt">No maps found</p>
      <p>Is the path correct?</p>
      <p class="bg-secondary rounded px-1.5 w-fit">{mods_path}</p>
    </div>
  {/if}
</div>
