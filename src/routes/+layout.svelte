<script lang="ts">
  import { Store } from "tauri-plugin-store-api";
  import { Button } from "$components/ui/button";
  import {
    ArrowLeft,
    Layers2,
    Maximize,
    Menu,
    Minus,
    X,
  } from "lucide-svelte";
  import "../app.pcss";
  import { ModeWatcher, setMode } from "mode-watcher";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";
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

  const config = new Store(".config.dat");
  let fullscreen = false;

  let theme: string;
  let mods_path: string;
  let oauth_token: string;
  let avatar_url: string;

  onMount(async () => {
    fullscreen = await appWindow.isMaximized();
    theme = await config.get("theme");
    mods_path = await config.get("mods_path");
    oauth_token = await config.get("oauth_token");
    avatar_url = await config.get("avatar_url");

    if (theme == null) {
      await config.set("theme", "dark");
      setMode("dark");
    } else {
      setMode(theme as "dark" | "light");
    }

    if (mods_path == null) {
      await config.set(
        "mods_path",
        "C:\\Users\\%user%\\AppData\\Local\\Pavlov\\Saved\\Mods"
      );
    }

    if (avatar_url == null) {
      setAvatarUrl(oauth_token);
      await config.set("avatar_url", avatar_url);
    }
  });

  const resize = async () => fullscreen = await appWindow.isMaximized();
</script>

<svelte:window on:resize={resize} />

<header
  class="sticky top-0 z-40 w-full border-b border-border bg-background/60 shadow-sm backdrop-blur justify-between flex flex-row"
>
  <div data-tauri-drag-region class="p-3 justify-between flex flex-row w-full">
    <div class="flex justify-start items-center">
      <Button
        on:click={() => history.back()}
        variant="default"
        class="items-center"
      >
        <ArrowLeft />
      </Button>
    </div>
    <div class="flex justify-end items-center">
      <Popover>
        <PopoverTrigger asChild let:builder>
          <Button
            builders={[builder]}
            class="h-10 w-10 rounded-full"
            size="icon"
            variant="ghost"
          >
            <Avatar>
              <AvatarImage src={avatar_url} />
              <AvatarFallback class="bg-primary"
                ><Menu class="text-primary-foreground" /></AvatarFallback
              >
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80 items-center flex justify-center">
          <a href="/settings">Settings</a>
        </PopoverContent>
      </Popover>
    </div>
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
</header>

<Toaster />
<ModeWatcher />
<slot />
