<script lang="ts">
  import { dev } from "$app/environment";
  import { goto } from "$app/navigation";
  import { Avatar, AvatarFallback, AvatarImage } from "$components/ui/avatar";
  import { Button } from "$components/ui/button";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$components/ui/dialog";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "$components/ui/popover";
  import { Toaster } from "$components/ui/sonner";
  import { getModsPath } from "$lib/modio-utils";
  import { gamemodes } from "$lib/pavlov-utils";
  import { persistentStore } from "$lib/stores";
  import { getGithubInfo, update } from "$lib/tauri-updater";
  import type { Filters } from "$lib/types";
  import { checkUpdate } from "@tauri-apps/api/updater";
  import { appWindow } from "@tauri-apps/api/window";
  import {
    CircleAlert,
    Home,
    Layers2,
    Maximize,
    Menu,
    Minus,
    RotateCw,
    Server,
    Settings,
    X,
  } from "lucide-svelte";
  import { ModeWatcher, mode, setMode } from "mode-watcher";
  import { OverlayScrollbars } from "overlayscrollbars";
  import "overlayscrollbars/overlayscrollbars.css";
  import { onMount } from "svelte";
  import SvelteMarkdown from "svelte-markdown";
  import { fade } from "svelte/transition";
  import "../app.pcss";

  let contentEl: HTMLDivElement;
  let scrollbar: OverlayScrollbars;
  $: if (scrollbar)
    scrollbar.options({
      scrollbars: {
        theme: $mode === "dark" ? "os-theme-light" : "os-theme-dark",
      },
    });

  let fullscreen = false;

  let githubInfo: any;
  let oauth_token: string;
  let avatar_url: string;
  let new_update: boolean;
  let theme: "dark" | "light";

  onMount(async () => {
    scrollbar = OverlayScrollbars(contentEl, {
      overflow: {
        x: "hidden",
      },
      scrollbars: {
        theme: $mode === "dark" ? "os-theme-light" : "os-theme-dark",
      },
    });
    fullscreen = await appWindow.isMaximized();

    if (!dev) {
      new_update = (await checkUpdate()).shouldUpdate;
    }

    // Initialize settings, if they dont exist
    if ((await persistentStore.get("theme")) == null) {
      await persistentStore.set("theme", "dark");
      setMode("dark");
    } else {
      setMode((await persistentStore.get("theme")) as "dark" | "light");
    }

    if ((await persistentStore.get("mods_path")) == null) {
      getModsPath();
    }

    if ((await persistentStore.get("delete_popup")) == null) {
      await persistentStore.set("delete_popup", true);
    }

    if ((await persistentStore.get("auto_path")) == null) {
      await persistentStore.set("auto_path", true);
    }

    if ((await persistentStore.get("show_type")) == null) {
      await persistentStore.set("show_type", true);
    }

    if ((await persistentStore.get("favorite_servers")) == null) {
      await persistentStore.set("favorite_servers", []);
    }

    if ((await persistentStore.get("server_filters")) == null) {
      let filters: Filters = {
        favorites: false,
        full: false,
        empty: false,
        locked: false,
        gamemodes: {},
      };
      for (const gamemode of gamemodes) {
        filters = {
          ...filters,
          gamemodes: { ...filters.gamemodes, [gamemode]: false },
        };
      }
      await persistentStore.set("server_filters", filters);
    }

    await persistentStore.save();

    theme = await persistentStore.get("theme");
    avatar_url = await persistentStore.get("avatar_url");

    githubInfo = await getGithubInfo();
  });

  const resize = async () => (fullscreen = await appWindow.isMaximized());
</script>

<svelte:window on:resize={resize} />

<header
  data-tauri-drag-region
  class="sticky h-[42px] top-0 z-40 w-full border-b border-border bg-background/60 shadow-sm backdrop-blur justify-between flex flex-row"
>
  <div class="flex justify-start items-center py-1 px-2 gap-1">
    <Button href="/" variant="ghost" size="icon">
      <Home />
    </Button>
    <Button on:click={() => location.reload()} variant="ghost" size="icon">
      <RotateCw class="w-6 h-6" />
    </Button>
    <div class="border h-full w-0 mx-1" />
    <Button
      class="gap-2 px-2 text-md"
      variant="ghost"
      on:click={() => goto("/serverlist")}
      ><Server /> Server List
    </Button>
  </div>
  <div class="flex items-center gap-2">
    {#if new_update}
      <div transition:fade={{ duration: 1000 }}>
        <Dialog>
          <DialogTrigger>
            <Button
              variant="ghost"
              class="flex justify-center items-center gap-2"
            >
              <CircleAlert color={theme == "dark" ? "#c32222" : "#ef4343"} />
              <p>New update available</p>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New update available</DialogTitle>
              <DialogDescription
                >Pavlov Map Manager - {githubInfo.tag_name}</DialogDescription
              >
            </DialogHeader>
            <SvelteMarkdown source={githubInfo.body} />
            <DialogFooter>
              <Button on:click={update}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    {/if}
    <Popover>
      <PopoverTrigger asChild let:builder>
        <Button builders={[builder]} size="icon" variant="ghost">
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="flex flex-col min-w-[220px]">
        <div class="py-2 flex items-center justify-center">
          <Avatar class="h-28 w-28">
            <AvatarImage src={avatar_url} />
            <AvatarFallback>{oauth_token ? "U" : "A"}</AvatarFallback>
          </Avatar>
        </div>
        <a
          href="/settings"
          class="flex items-center gap-1 text-foreground/70 hover:bg-muted hover:text-foreground px-4 py-2 text-sm rounded-md"
          ><Settings class="w-6 h-6" /> Settings</a
        >
        <a
          href="https://mod.io/g/pavlov"
          target="_blank"
          class="flex items-center gap-1 text-foreground/70 hover:bg-muted hover:text-foreground px-4 py-2 text-sm rounded-md"
          ><img
            src="/mod-io-icon.png"
            alt="Mod.io"
            class="rounded-full w-6 h-6"
          /> Mod.io</a
        >
      </PopoverContent>
    </Popover>
    <div>
      <Button
        on:click={() => appWindow.minimize()}
        variant="ghost"
        class="rounded-none h-full"
      >
        <Minus />
      </Button>
      <Button
        on:click={() => appWindow.toggleMaximize()}
        variant="ghost"
        class="rounded-none h-full"
      >
        {#if fullscreen}
          <Layers2 />
        {:else}
          <Maximize />
        {/if}
      </Button>
      <Button
        on:click={() => appWindow.close()}
        variant="ghost"
        class="h-full hover:bg-destructive rounded-none"
      >
        <X />
      </Button>
    </div>
  </div>
</header>

<Toaster />
<ModeWatcher />
<div
  class="h-[calc(100vh-42px)]"
  bind:this={contentEl}
  data-overlayscrollbars-initialize
>
  <slot />
</div>
