<script lang="ts">
  import { Store } from "tauri-plugin-store-api";
  import { Button } from "$components/ui/button";
  import {
    ArrowLeft,
    Settings,
    Layers2,
    Maximize,
    Minus,
    X,
  } from "lucide-svelte";
  import "../app.pcss";
  import { ModeWatcher, setMode } from "mode-watcher";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";
  import { Toaster } from "$components/ui/sonner";
  import { onMount } from "svelte";
  import { appWindow } from "@tauri-apps/api/window";
  import { toast } from "svelte-sonner";

  const config = new Store(".config.dat");
  let fullscreen = false;

  let theme: string;
  let mods_path: string;
  let oauth_token: string;

  onMount(async () => {
    fullscreen = await appWindow.isMaximized();
    theme = await config.get("theme");
    mods_path = await config.get("mods_path");
    oauth_token = await config.get("oauth_token");

    if (theme == null) {
      await config.set("theme", "dark");
      setMode("dark");
    } else {
      setMode(theme as "dark" | "light");
    }

    setMode("light")

    if (mods_path == null) {
      await config.set(
        "mods_path",
        "C:\\Users\\%user%\\AppData\\Local\\Pavlov\\Saved\\Mods"
      );
    }
  });

  const resize = async () => (fullscreen = await appWindow.isMaximized());
</script>

<svelte:window on:resize={resize}/>

<header
  class="sticky top-0 z-40 w-full border-b border-border bg-background/60 shadow-sm backdrop-blur"
>
  <div class="flex flex-row items-center w-full">
    <div
      data-tauri-drag-region
      class="justify-between flex items-center w-full"
    >
      <Button
        on:click={() => history.back()}
        variant="ghost"
        class="rounded-none shadow-none"
      >
        <ArrowLeft />
      </Button>
      <Button
        on:click={() => toast("Settings")}
        variant="ghost"
        class="rounded-none shadow-none"
      >
        <Settings />
      </Button>
    </div>
    <div class="flex items-center self-start">
      <Button
        on:click={() => appWindow.minimize()}
        variant="ghost"
        class="rounded-none shadow-none"
      >
        <Minus />
      </Button>
      <Button
        on:click={() => appWindow.toggleMaximize()}
        variant="ghost"
        class="rounded-none shadow-none"
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
        class="hover:bg-destructive rounded-none shadow-none"
      >
        <X />
      </Button>
    </div>
  </div>
</header>

<Toaster />
<ModeWatcher />
<slot />
