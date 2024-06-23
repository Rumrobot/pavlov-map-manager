<script lang="ts">
  import { ModCard } from "$components";
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "$components/ui/accordion";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input/";
  import { Label } from "$components/ui/label";
  import { ProgressBar } from "$components/ui/progress-bar";
  import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "$components/ui/tooltip";
  import {
    addDownload,
    changeOauthToken,
    loadMods,
    subscribe,
    testOauthToken,
  } from "$lib/modio-utils";
  import {
    appStore,
    modsStore,
    persistentStore,
    queueStore,
  } from "$lib/stores";
  import { humanFileSize } from "$lib/utils";
  import { removeFile } from "@tauri-apps/api/fs";
  import { open } from "@tauri-apps/api/shell";
  import { invoke } from "@tauri-apps/api/tauri";
  import {
    ArrowDownToLine,
    ExternalLink,
    LoaderCircle,
    Star,
  } from "lucide-svelte";
  import { onMount } from "svelte";

  let newOauthToken = "";
  let allSubscribed: boolean;
  let allUpdated: boolean;

  let oauthToken = null;
  let theme: string;

  $: {
    allUpdated = true;
    allSubscribed = true;

    for (const mod of Object.keys($modsStore)) {
      if (
        $modsStore[mod].currentVersion != $modsStore[mod].latestVersion &&
        !$queueStore.includes(mod.toString())
      ) {
        allUpdated = false;
      }
      if (!$modsStore[mod].subscribed) {
        allSubscribed = false;
      }
    }
  }

  let loading = true;
  onMount(async () => {
    oauthToken = await persistentStore.get("oauth_token");
    theme = await persistentStore.get("theme");

      if (!oauthToken) {
        loading = false;
        return;
      }

      $appStore.status = "Checking OAuth token";
      const validOauthToken = await testOauthToken(oauthToken);
      if (!validOauthToken) {
        oauthToken = null;
        persistentStore.set("oauth_token", null);
        persistentStore.set("avatar_url", null);
        loading = false;
        return;
      }

      await loadMods();

      $appStore.status = "Removing old .zip files";
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

      $appStore.status = "Done";
      loading = false;
  });
</script>

<div class="flex items-center justify-center m-5">
  {#if !loading}
    {#if oauthToken}
      {#if $modsStore != null}
        <div class="flex flex-col w-full max-w-6xl gap-2">
          <div class="flex items-center flex-col gap-1.5">
            {#if $appStore.downloading}
              <ProgressBar
                class="w-full"
                value={($appStore.receivedSize / $appStore.totalSize) * 100}
                throttled
                indeterminate={$appStore.downloadStatus !== "Downloading"}
              />
            {/if}
            <div
              class="w-full grid {$appStore.downloading
                ? 'justify-between grid-cols-3'
                : 'justify-end flex flex-row'}"
            >
              <div
                class="items-center flex gap-4 {$appStore.downloading
                  ? ''
                  : 'hidden'}"
              >
                {#if $appStore.initialQueueLength > 1}
                  <span
                    >{$appStore.queueOnGoing}/{$appStore.initialQueueLength}</span
                  >
                {/if}
                <span
                  >{humanFileSize($appStore.downloadSpeed)}/s - {humanFileSize(
                    $appStore.receivedSize
                  )}/{humanFileSize($appStore.totalSize)}</span
                >
              </div>
              <div
                class="items-center justify-self-center flex {$appStore.downloading
                  ? ''
                  : 'hidden'}"
              >
                {#if $appStore.downloadStatus == "Downloading"}
                  Downloading {$appStore.currentlyDownloading}
                {:else if $appStore.downloadStatus == "Extracting the file"}
                  Extracting {$appStore.currentlyDownloading}
                {:else}
                  {$appStore.downloadStatus}
                {/if}
              </div>
              <div class="flex items-center gap-1.5 justify-self-end">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      disabled={allUpdated}
                      on:click={() => {
                        for (const mod of Object.keys($modsStore)) {
                          if (
                            $modsStore[mod].latestVersion !=
                            $modsStore[mod].currentVersion
                          ) {
                            addDownload(mod);
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
                        for (const mod of Object.keys($modsStore)) {
                          if (!$modsStore[mod].subscribed) {
                            subscribe(mod);
                          }
                        }
                      }}
                      ><Star
                        fill={allSubscribed
                          ? theme == "dark"
                            ? "#18181b"
                            : "#f5f5f7"
                          : "none"}
                      />
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
              </div>
            </div>
          </div>
          <Accordion value={["new_update", "updated"]}>
            <AccordionItem
              value="new_update"
              class="flex flex-col justify-start items-start pb-1 {allUpdated &&
              $queueStore.length == 0
                ? 'hidden'
                : ''}"
            >
              <AccordionTrigger class="text-xl py-2"
                >New update available</AccordionTrigger
              >
              <AccordionContent
                class="grid grid-cols-2 mt-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {#each Object.keys($modsStore) as mod}
                  {#if $modsStore[mod].currentVersion != $modsStore[mod].latestVersion}
                    <ModCard {mod} />
                  {/if}
                {/each}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="updated"
              class="flex flex-col items-start justify-start pb-1 "
            >
              <AccordionTrigger class="text-xl">Up to date</AccordionTrigger>
              <AccordionContent
                class="grid grid-cols-2 mt-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {#each Object.keys($modsStore) as mod}
                  {#if $modsStore[mod].currentVersion == $modsStore[mod].latestVersion}
                    <ModCard {mod} />
                  {/if}
                {/each}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center">
          <p>No maps found</p>
        </div>
      {/if}
    {:else}
      <div class="flex flex-col items-center justify-center gap-y-3">
        <p>A mod.io OAuth token is required to manage your mods.</p>
        <h3 class="text-2xl">How to get an OAuth token</h3>
        <div class="flex flex-col gap-y-1">
          <p>Go to mod.io -> My account -> Access</p>
          <button
            on:click={() => open("https://mod.io/me/access")}
            class="bg-primary text-primary-foreground rounded-md p-1.5 justify-self-center mb-6 gap-1 flex items-center justify-center"
            role="link"
            tabindex="0"
          >
            <ExternalLink />
            https://mod.io/me/access</button
          >
          <div class="flex">
            <p>1. Give the client a name, e.g.</p>
            <p
              class="flex items-center px-1 ml-1 rounded-md shadow-lg bg-primary text-primary-foreground"
            >
              Pavlov Map Downloader
            </p>
            <p>, and click create.</p>
          </div>
          <div class="flex">
            <p>2. Give the token a name, e.g.</p>
            <p
              class="px-1 ml-1 rounded-md shadow-lg bg-primary text-primary-foreground"
            >
              Token
            </p>
            <p>, and select</p>
            <p
              class="px-1 mx-1 rounded-md shadow-lg bg-primary text-primary-foreground"
            >
              Read + Write
            </p>
            <p>in the dropdown menu.</p>
          </div>
          <p>3. Copy the token, then paste it here and click confirm.</p>
        </div>
        <div
          class="flex flex-col gap-y-1.5 justify-self-center items-start mt-5"
        >
          <Label>Mod.io OAuth token</Label>
          <div class="flex flex-row gap-1">
            <Input placeholder="OAuth token" bind:value={newOauthToken}></Input>
            <Button
              on:click={() => {
                changeOauthToken(newOauthToken);
              }}
              variant="outline">Confirm</Button
            >
          </div>
        </div>
        <img
          src="infographic.png"
          alt="How to get a OAuth token"
          class="rounded-md max-w-[1920px] w-[70%]"
        />
      </div>
    {/if}
  {:else}
    <div
      class="flex flex-col items-center justify-center w-full max-w-6xl gap-y-5"
    >
      <LoaderCircle size="50" class="animate-spin" />
      {$appStore.status}
    </div>
  {/if}
</div>
