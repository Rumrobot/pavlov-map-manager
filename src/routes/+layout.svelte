<script lang="ts">
  import { Store } from "tauri-plugin-store-api";
  import { Button } from "$components/ui/button";
  import {
    Home,
    Layers2,
    Maximize,
    Menu,
    Minus,
    RotateCw,
    Settings,
    X,
  } from "lucide-svelte";
  import "overlayscrollbars/overlayscrollbars.css";
  import "../app.pcss";
  import { ModeWatcher, setMode, mode } from "mode-watcher";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "$components/ui/popover";
  import { Avatar, AvatarFallback, AvatarImage } from "$components/ui/avatar";
  import { setAvatarUrl } from "$lib/utils";
  import { Toaster } from "$components/ui/sonner";
  import { onMount } from "svelte";
  import { appWindow } from "@tauri-apps/api/window";
  import { OverlayScrollbars } from "overlayscrollbars";
  import { getModsPath } from "$lib/utils";

  let contentEl: HTMLDivElement;
  let scrollbar: OverlayScrollbars;
  $: if (scrollbar)
    scrollbar.options({
      scrollbars: {
        theme: $mode === "dark" ? "os-theme-light" : "os-theme-dark",
      },
    });

  const config = new Store(".config.dat");
  let fullscreen = false;

  let theme: string;
  let mods_path: string;
  let oauth_token: string;
  let auto_path: boolean;
  let avatar_url: string;
  let delete_popup: boolean;

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
    theme = await config.get("theme");
    mods_path = await config.get("mods_path");
    oauth_token = await config.get("oauth_token");
    auto_path = await config.get("auto_path");
    avatar_url = await config.get("avatar_url");
    delete_popup = await config.get("delete_popup");

    if (theme == null) {
      await config.set("theme", "dark");
      setMode("dark");
    } else {
      setMode(theme as "dark" | "light");
    }

    if (mods_path == null) {
      getModsPath();
    }

    if (avatar_url == null) {
      setAvatarUrl(oauth_token);
      await config.set("avatar_url", avatar_url);
    }

    if (delete_popup == null) {
      await config.set("delete_popup", false);
    }

    if (auto_path == null) {
      await config.set("auto_path", true);
    }

    await config.save();
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
  </div>
  <div class="flex items-center gap-2">
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
          ><img src="/mod-io-icon.png" alt="Mod.io" class="rounded-full w-6 h-6" /> Mod.io</a
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
