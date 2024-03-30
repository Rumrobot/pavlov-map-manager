<script lang="ts">
  import { Button } from "$components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$components/ui/card";
  import { Progress } from "$components/ui/progress";
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
  } from "$components/ui/tooltip";
  import { Input } from "$components/ui/input/";
  import { Label } from "$components/ui/label";
  import { removeFile } from "@tauri-apps/api/fs";
  import { humanFileSize, setAvatarUrl } from "$lib/utils";
  import { invoke } from "@tauri-apps/api/tauri";
  import { open } from "@tauri-apps/api/shell";
  import {
    ArrowDownToLine,
    RefreshCcw,
    Star,
    Trash,
    LoaderCircle,
  } from "lucide-svelte";
  import { copy } from "svelte-copy";
  import { Store } from "tauri-plugin-store-api";
  import Bottleneck from "bottleneck";
  import { download } from "tauri-plugin-upload-api";
  import { toast } from "svelte-sonner";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "$components/ui/alert-dialog";
  import { get } from "svelte/store";

  const config = new Store(".config.dat");
  const limiter = new Bottleneck({
    minTime: 100,
  });

  let maps: Array<string> = [];
  let subscriptions: Array<string> = [];
  let mapData: {
    [key: string]: {
      title: string;
      imageUrl: string;
      modUrl: string;
      newUpdate: boolean;
      currentVersion: string;
      latestVersion: string;
      subscribed: boolean;
      installedLocally: boolean;
    };
  } = new Proxy(
    {},
    {
      get(target, prop, receiver) {
        if (!(prop in target)) {
          target[prop] = {
            title: null,
            imageUrl: null,
            modUrl: null,
            newUpdate: false,
            currentVersion: null,
            latestVersion: null,
            subscribed: false,
            installedLocally: true,
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }
  );

  let newOauthToken: string;
  let oauthToken: string;
  let modsPath: string;
  let allSubscribed: boolean;
  let allUpdated: boolean;

  let loading: boolean = true;
  let status: string;
  let validOauthToken: boolean = false;

  let downloading: boolean = false;
  let currentlyDownloading: string;
  let receivedSize: number = 0;
  let totalSize: number = 0;
  let downloadProgress: number = 0;
  let queueProgress: number = 0;
  let downloadStatus: string;
  let queue: Array<string> = [];
  let initialQueueLength: number = 0;
  let queueDownloaded: number = 0;

  async function getMaps() {
    const path = await config.get("mods_path");
    try {
      maps = await invoke("ls", { path });

      maps = maps.filter((map: string) => map.startsWith("UGC"));
      maps = maps.map((map: string) => map.split("UGC")[1]);

      for (const map of subscriptions) {
        if (!maps.includes(map.toString())) {
          maps.push(map);
        }
      }

      return;
    } catch (error) {
      toast.error("Error while reading maps from path: " + path);
      return [];
    }
  }

  async function modioRequest(
    url: string,
    method: string,
    headers: any = {},
    body?: string
  ) {
    headers.Authorization = "Bearer " + oauthToken;
    headers.Accept = "application/json";

    const response = await limiter.schedule(() =>
      fetch(url, {
        method: method,
        headers: headers,
        body: body,
      })
    );

    return response;
  }

  async function getMapData(map: string) {
    if (!mapData.hasOwnProperty(map)) {
      const response = await modioRequest(
        `https://api.mod.io/v1/games/3959/mods/${map}`,
        "GET"
      );
      if (!response.ok) {
        toast.error("Error while fetching map data for map: " + map);

        // Remove the map from the list if it doesn't exist on mod.io
        maps = maps.filter((m) => m != map);
        mapData = Object.fromEntries(
          Object.entries(mapData).filter(([key]) => key != map)
        );
        return;
      }
      const data = await response.json();

      mapData[map].title = data.name;
      mapData[map].imageUrl = data.logo.thumb_1280x720;
      mapData[map].modUrl = data.profile_url;

      const platforms = data.platforms;
      for (const platform of platforms) {
        if (platform.platform == "windows") {
          mapData[map].latestVersion = platform.modfile_live;
        }
      }
    }

    const filePath = `${modsPath}\\UGC${map}\\taint`;
    let currentVersion: string;
    try {
      currentVersion = await invoke("read_file", {
        filePath: filePath,
      });
    } catch (error) {
      mapData[map].installedLocally = false;
    }
    mapData[map].currentVersion = currentVersion as string;

    if (subscriptions.includes(map)) {
      mapData[map].subscribed = true;
    }

    if (mapData[map].latestVersion != null) {
      if (mapData[map].latestVersion != currentVersion) {
        mapData[map].newUpdate = true;
      } else {
        mapData[map].newUpdate = false;
      }
    } else {
      maps = maps.filter((m) => m != map);
      mapData = Object.fromEntries(
        Object.entries(mapData).filter(([key]) => key != map)
      );
    }
    return;
  }

  async function getSubscriptions() {
    let allRead = false;
    let page = 0;

    while (!allRead) {
      const response = await modioRequest(
        `https://api.mod.io/v1/me/subscribed?game_id=3959&tags=Map`,
        "GET"
      );
      if (!response.ok) {
        toast.error("Error while fetching subscribed maps");
        return;
      }
      const data = await response.json();

      for (const map of data.data) {
        subscriptions.push(map.id);
        maps.push(map.id);

        mapData[map.id].title = map.name;
        mapData[map.id].imageUrl = map.logo.thumb_1280x720;
        mapData[map.id].modUrl = map.profile_url;

        for (const platform of map.platforms) {
          if (platform.platform == "windows") {
            mapData[map.id].latestVersion = platform.modfile_live;
          }
        }
      }

      if (data.result_count == 100) {
        page++;
      } else {
        allRead = true;
      }
    }
    return;
  }

  async function subscribe(map: string) {
    if (mapData[map].subscribed) {
      toast.error("You are already subscribed to map: " + mapData[map].title);
      return;
    }

    const response = await modioRequest(
      `https://api.mod.io/v1/games/3959/mods/${map}/subscribe`,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      "include_dependencies=false"
    );
    if (!response.ok) {
      toast.error("Error while subscribing to map: " + mapData[map].title);
      mapData[map].subscribed = false;
      return;
    }

    mapData[map].subscribed = true;
    checkAll();
  }

  async function unsubscribe(map: string) {
    if (!mapData[map].subscribed) {
      toast.error("You are already unsubscribed to map: " + mapData[map].title);
      return;
    }

    const response = await modioRequest(
      `https://api.mod.io/v1/games/3959/mods/${map}/subscribe`,
      "DELETE",
      {
        "Content-Type": "application/x-www-form-urlencoded",
      }
    );
    if (!response.ok) {
      toast.error("Error while unsubscribing from map: " + mapData[map].title);
      mapData[map].subscribed = true;
      return;
    }

    mapData[map].subscribed = false;
    checkAll();
  }

  async function downloadMap(map: string) {
    // Set downloading to true to show the progress bar
    currentlyDownloading = mapData[map].title;
    downloadStatus = "Fetching file info";

    // Get the file info
    const fileInfoResponse = await modioRequest(
      `https://api.mod.io/v1/games/3959/mods/${map}/files/${mapData[map].latestVersion}`,
      "GET"
    );
    if (!fileInfoResponse.ok) {
      toast.error(
        "Error while fetching file info for map: " + mapData[map].title
      );
      downloadStatus = "Error fetching file info";
      return;
    }

    downloadStatus = "Checking file info";

    const fileInfo = await fileInfoResponse.json();

    // Set the total byte size of the file
    totalSize = fileInfo.filesize;

    // Check if the file is infected with a virus
    if (fileInfo.virus_positive == 1) {
      toast.error("Virus detected in map: " + mapData[map].title);
      downloadStatus = "Virus detected";
      return;
    }

    downloadStatus = "Downloading";
    // Download the file
    try {
      const headers = new Map();
      headers.set("Authorization", `Bearer ${oauthToken}`);
      headers.set("Content-Type", "application/x-www-form-urlencoded");
      headers.set("Accept", "application/json");
      headers.set("X-Modio-Platform", "windows");

      await download(
        fileInfo.download.binary_url,
        `${map}.zip`,
        (progress, total) => {
          receivedSize += progress;
          totalSize = total;
          downloadProgress = (receivedSize / total) * 100;
        },
        headers
      );
    } catch (error) {
      toast.error("Error while downloading file");
      downloadStatus = "Error downloading file";
      return;
    }

    downloadStatus = "Extracting the file";
    // Extract the zip file and remove it
    try {
      await invoke("extract_zip", {
        zipPath: `${map}.zip`,
        extractPath: `${modsPath}\\UGC${map}\\Data`,
      });
      await removeFile(`${map}.zip`);
    } catch (error) {
      toast.error("Error while extracting file");
      await removeFile(`${map}.zip`);
      downloadStatus = "Error extracting file";
      return;
    }

    downloadStatus = "Saving the new version number";
    // Save the new version number to the taint file
    await invoke("write_text_file", {
      filePath: `${modsPath}\\UGC${map}\\taint`,
      contents: mapData[map].latestVersion.toString(),
    });

    totalSize = 0;
    receivedSize = 0;
    downloadProgress = 0;

    downloadStatus = "Done";
    mapData[map].newUpdate = false;
    return;
  }

  async function downloadQueue() {
    downloading = true;
    await downloadMap(queue[0]);
    queue.shift();

    if (queue.length > 0) {
      queueDownloaded++;
      queueProgress = (queueDownloaded / initialQueueLength) * 100;
      downloadQueue();
      return;
    } else {
      queueProgress = 0;
      queueDownloaded = 0;
      initialQueueLength = 0;
      checkAll();
      downloading = false;
      return;
    }
  }

  async function addDownloadQueue(maps: Array<string>) {
    for (const map of maps) {
      if (mapData[map].newUpdate && !queue.includes(map)) {
        queue.push(map);
      } else {
      }
    }
    if (initialQueueLength == 0) {
      downloadQueue();
    }
    initialQueueLength = initialQueueLength + maps.length;

    return;
  }

  async function deleteMod(map: string) {
    if (mapData[map].subscribed) {
      await unsubscribe(map);
    }

    maps = maps.filter((m) => m != map);
    mapData = Object.fromEntries(
      Object.entries(mapData).filter(([key, value]) => key != map)
    );

    checkAll();

    await invoke("remove_dir", {
      path: `${modsPath}\\UGC${map}`,
    });

    return;
  }

  async function changeOauthToken(input: string) {
    const newAvatarUrl = await setAvatarUrl(input);
    oauthToken = input;

    if (await testOauthToken()) {
      toast.success("OAuth token set successfully");
    } else {
      toast.error("Invalid OAuth token");
      oauthToken = await config.get("oauth_token");
      return;
    }

    await config.set("oauth_token", input);
    await config.set("avatar_url", newAvatarUrl);

    await config.save();
    location.reload();
  }

  async function testOauthToken() {
    const response = await modioRequest("https://api.mod.io/v1/me", "GET");
    if (!response.ok) {
      toast.error("Invalid OAuth token");
      return false;
    }
    return true;
  }

  function checkAll() {
    allUpdated = true;
    allSubscribed = true;

    for (const map of maps) {
      if (mapData[map].newUpdate) {
        allUpdated = false;
      }
    }
    for (const map of maps) {
      if (!mapData[map].subscribed) {
        allSubscribed = false;
      }
    }
    return;
  }

  async function load() {
    status = "Checking OAuth token";
    validOauthToken = await testOauthToken();
    if (!validOauthToken) {
      config.set("avatar_url", null);
      return;
    }

    status = "Finding maps";
    try {
      await getMaps();
    } catch (error) {
      return;
    }

    status = "Fetching subscriptions";
    await getSubscriptions();

    let i: number = 0;
    for (const map of maps) {
      status = `Fetching map data: ${i}/${maps.length}`;
      try {
        await getMapData(map);
      } catch (error) {
        i--;
      }
      i++;
    }

    status = "Removing old .zip files";
    try {
      const files: Array<string> = await invoke("ls", {
        path: "./",
      });
      for (const file of files) {
        if (file.endsWith(".zip")) {
          await removeFile(file);
        }
      }
    } catch (error) {
      return;
    }
  }

  (async () => {
    loading = true;
    oauthToken = await config.get("oauth_token");
    modsPath = await config.get("mods_path");

    await load();
    checkAll();

    status = "Done";
    loading = false;
  })();
</script>

<div class="flex justify-center items-center m-5">
  {#if validOauthToken}
    {#if maps.length > 0}
      {#if loading}
        <div
          class="flex flex-col gap-y-5 w-full max-w-6xl justify-center items-center"
        >
          <LoaderCircle size="50" class="animate-spin" />
          {status}
        </div>
      {:else}
        <div class="flex flex-col gap-y-5 w-full max-w-6xl">
          <div class="flex items-center flex-col gap-y-1.5">
            <h3 class="text-xl {downloading ? '' : 'hidden'} items-center">
              Downloading: {currentlyDownloading}
            </h3>
            <Progress
              value={queueProgress}
              class="w-full {downloading ? '' : 'hidden'}"
            />
            <div
              class="items-center flex justify-self-start w-full {downloading
                ? ''
                : 'hidden'}"
            >
              {queueDownloaded}/{initialQueueLength}
            </div>
            <Progress
              value={downloadProgress}
              class="w-full {downloading ? '' : 'hidden'}"
            />
            <div
              class="w-full grid {downloading
                ? 'justify-between grid-cols-3'
                : 'justify-end flex flex-row'}"
            >
              <div class="items-center flex {downloading ? '' : 'hidden'}">
                {humanFileSize(receivedSize)}/{humanFileSize(totalSize)}
              </div>
              <div
                class="items-center justify-self-center flex {downloading
                  ? ''
                  : 'hidden'}"
              >
                {downloadStatus}
              </div>
              <div class="flex items-center gap-x-1.5 justify-self-end">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      disabled={allUpdated}
                      on:click={() => {
                        for (const map of Object.keys(mapData)) {
                          if (mapData[map].newUpdate) {
                            addDownloadQueue([map]);
                          }
                        }
                      }}><ArrowDownToLine /></Button
                    >
                  </TooltipTrigger>
                  <TooltipContent>
                    {#if allUpdated}
                      All maps are up to date
                    {:else}
                      Update all maps
                    {/if}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      disabled={allSubscribed}
                      on:click={() => {
                        for (const map of Object.keys(mapData)) {
                          if (!mapData[map].subscribed) {
                            subscribe(map);
                          }
                        }
                      }}
                      ><Star fill={allSubscribed ? "bg-primary" : "none"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {#if allSubscribed}
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
          <div
            class="flex flex-col justify-start items-start {allUpdated
              ? 'hidden'
              : ''}"
          >
            <h2 class="text-xl">New update available</h2>
            <div
              class="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {#each Object.keys(mapData) as map}
                {#if mapData[map].newUpdate}
                  <Card class="m-1 items-center text-center">
                    <CardHeader>
                      <CardTitle class="text-2xl truncate overflow-ellipsis"
                        >{mapData[map].title}</CardTitle
                      >
                    </CardHeader>
                    <CardContent>
                      <button
                        on:click={() => open(mapData[map].modUrl)}
                        role="link"
                        tabindex="0"
                      >
                        <img
                          src={mapData[map].imageUrl}
                          alt={mapData[map].title}
                          class="rounded-md"
                        />
                      </button>
                      <div class="mt-1.5 flex flex-row justify-between">
                        {#if mapData[map].newUpdate}
                          <Button
                            on:click={() => addDownloadQueue([map])}
                            class={!mapData[map].newUpdate
                              ? "cursor-not-allowed hover:bg-primary"
                              : ""}
                          >
                            <ArrowDownToLine />
                          </Button>
                        {/if}
                        {#if mapData[map].subscribed}
                          <Button on:click={() => unsubscribe(map)}>
                            <Star fill="bg-primary" />
                          </Button>
                        {:else}
                          <Button on:click={() => subscribe(map)}>
                            <Star fill="none" />
                          </Button>
                        {/if}
                        <AlertDialog>
                          <AlertDialogTrigger asChild let:builder>
                            <Button builders={[builder]} class="bg-red-500">
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle
                                >Are you absolutely sure?</AlertDialogTitle
                              >
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the map: {mapData[map]
                                  .title}. You can get it back by downloading it
                                again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction on:click={() => deleteMod(map)}
                                >Confirm</AlertDialogAction
                              >
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
              class="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {#each Object.keys(mapData) as map}
                {#if mapData[map].newUpdate != true}
                  <Card class="m-1 items-center text-center">
                    <CardHeader>
                      <CardTitle class="text-2xl truncate overflow-ellipsis"
                        >{mapData[map].title}</CardTitle
                      >
                    </CardHeader>
                    <CardContent>
                      <button
                        on:click={() => open(mapData[map].modUrl)}
                        role="link"
                        tabindex="0"
                      >
                        <img
                          src={mapData[map].imageUrl}
                          alt={mapData[map].title}
                          class="rounded-md"
                        />
                      </button>
                      <div class="mt-1.5 flex flex-row justify-between">
                        {#if mapData[map].subscribed}
                          <Button on:click={() => unsubscribe(map)}>
                            <Star fill="bg-primary" />
                          </Button>
                        {:else}
                          <Button on:click={() => subscribe(map)}>
                            <Star fill="none" />
                          </Button>
                        {/if}
                        <AlertDialog>
                          <AlertDialogTrigger asChild let:builder>
                            <Button builders={[builder]} class="bg-red-500">
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle
                                >Are you absolutely sure?</AlertDialogTitle
                              >
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the map: {mapData[map]
                                  .title}. You can get it back by downloading it
                                again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction on:click={() => deleteMod(map)}
                                >Confirm</AlertDialogAction
                              >
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                {/if}
              {/each}
            </div>
          </div>
        </div>{/if}
    {:else}
      <div class="flex items-center justify-center flex-col">
        <p>No maps found</p>
        <br />
        <p>Is the path correct?</p>
        <p class="bg-secondary rounded px-1.5 w-fit">{modsPath}</p>
      </div>
    {/if}
  {:else}
    <div class="flex items-center justify-center flex-col gap-y-3">
      <p>Invalid OAuth token</p>
      <h3 class="text-2xl">How to get an OAuth token</h3>
      <div class="flex flex-col gap-y-1">
        <p>Go to mod.io -> My account -> Access</p>
        <button
          on:click={() => open("https://mod.io/me/access")}
          class="bg-secondary rounded-md p-1.5 justify-self-center mb-8"
          role="link"
          tabindex="0">https://mod.io/me/access</button
        >
        <div class="flex">
          <p>1. Give the client a name, e.g.</p>
          <Tooltip>
            <TooltipTrigger>
              <button
                class="bg-secondary rounded-md ml-1 px-1"
                use:copy={"Pavlov Map Downloader"}
                on:click={() => toast.success("Copied to clipboard")}
              >
                Pavlov Map Downloader
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to copy</TooltipContent>
          </Tooltip>
          <p>, and click create.</p>
        </div>
        <div class="flex">
          <p>2. Give the token a name, e.g.</p>
          <Tooltip>
            <TooltipTrigger>
              <button
                class="bg-secondary rounded-md ml-1 px-1"
                use:copy={"Pavlov Map Downloader"}
                on:click={() => toast.success("Copied to clipboard")}
              >
                Token
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to copy</TooltipContent>
          </Tooltip>
          <p>, and select</p>
          <p class="bg-secondary rounded-md mx-1 px-1">Read + Write</p>
          <p>in the dropdown menu.</p>
        </div>
        <p>3. Copy the token, then paste it here and click confirm.</p>
      </div>
      <div class="flex flex-col gap-y-1.5 justify-self-center items-start mt-5">
        <Label>Mod.io OAuth token</Label>
        <div class="flex flex-row gap-x-1">
          <Input
            placeholder={oauthToken == null ? "Token" : oauthToken}
            bind:value={newOauthToken}
          ></Input>
          <AlertDialog>
            <AlertDialogTrigger asChild let:builder>
              <Button builders={[builder]} variant="outline">Confirm</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently remove the
                  old OAuth token from the application. If you dont have it
                  written down, then it will be lost forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  on:click={() => changeOauthToken(newOauthToken)}
                  >Confirm</AlertDialogAction
                >
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <img
        src="infographic.png"
        alt="How to get a OAuth token"
        class="rounded-md max-w-[1920px] w-[70%]"
      />
    </div>
  {/if}
</div>
