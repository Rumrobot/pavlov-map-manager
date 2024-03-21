<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$components/ui/card";
  import { invoke } from "@tauri-apps/api/tauri";
  import { onMount } from "svelte";
  import { Store } from "tauri-plugin-store-api";

  const config = new Store(".config.dat");

  let maps: Array<string> = [];
  let map_data: {
    [key: string]: { title: string; image_url: string; new_update: boolean };
  } = {};
  let oauth_token: string;
  let mods_path: string;

  (async () => {
    oauth_token = await config.get("oauth_token");
    mods_path = await config.get("mods_path");
  })();

  async function get_maps() {
    const path = await config.get("mods_path");
    try {
      maps = await invoke("list_dir", { path });
      get_map_data(maps);
      return maps;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async function get_map_data(maps) {
    await Promise.all(
      maps.map(async (map) => {
        try {
          const response = await fetch(
            `https://api.mod.io/v1/games/3959/mods/${map.split("UGC")[1]}`,
            {
              method: "GET",
              headers: {
                Authorization: "Bearer " + oauth_token,
              },
            }
          );
          if (!response.ok) {
            console.error("Error while fetching map data");
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
            console.error("Error: No windows version found");
          }

          map_data[map] = {
            title: data.name,
            image_url: data.logo.thumb_1280x720,
            new_update: new_update,
          };
        } catch (error) {
          console.error("Error:", error);
          map_data[map] = {
            title: map,
            image_url: "https://www.freeiconspng.com/uploads/error-icon-4.png",
            new_update: false,
          };
        }
      })
    );
  }

  onMount(async () => {
    await get_maps();
  });
</script>

<div class="flex justify-center items-center m-5">
  {#if maps.length > 0}
    <div
      class="flex flex-col gap-y-5 justify-start items-start w-full max-w-6xl"
    >
      <div class="flex flex-col justify-start items-start">
        <div>
          <h2 class="text-xl">New update available</h2>
        </div>
        <div
          class="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {#each Object.entries(map_data) as [_, map]}
            {#if map.new_update == true}
              <Card class="m-1 items-end text-center">
                <CardHeader>
                  <CardTitle class="text-2xl">{map.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={map.image_url}
                    alt={map.title}
                    class="rounded-t-md"
                  />
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
              <Card class="m-1 items-end text-center">
                <CardHeader>
                  <CardTitle class="text-2xl">{map.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={map.image_url}
                    alt={map.title}
                    class="rounded-t-md"
                  />
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
