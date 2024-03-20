<script lang="ts">
  import { Store } from "tauri-plugin-store-api";
  import { Button } from "$components/ui/button";
  import { ArrowBigLeft, Menu } from "lucide-svelte";
  import "../app.pcss";
  import { ModeWatcher, setMode } from "mode-watcher";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "$components/ui/popover";
  import { Avatar, AvatarFallback, AvatarImage } from "$components/ui/avatar";
  import { setAvatarUrl } from "$lib/utils";

  const config = new Store(".config.dat");

  let theme: string;
  let mods_path: string;
  let oauth_token: string;
  let avatar_url: string;

  (async () => {
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
  })();

  
</script>

<header
  class="sticky top-0 z-40 p-3 w-full border-b border-border bg-background/60 shadow-sm backdrop-blur justify-between flex flex-row"
>
  <div class="flex justify-start items-center">
    <Button
      on:click={() => history.back()}
      variant="outline"
      class="items-center"
    >
      <ArrowBigLeft />
    </Button>
  </div>
  <div class="flex justify-end items-center">
    <Popover>
      <PopoverTrigger asChild let:builder>
        <Button
          builders={[builder]}
          class="relative h-10 w-10 min-w-10 items-center justify-center rounded-full"
          size="icon"
          variant="outline"
        >
          {#if oauth_token == null}
            <Menu />
          {:else}
            <Avatar>
              <AvatarImage src={avatar_url} />
              <AvatarFallback><Menu /></AvatarFallback>
            </Avatar>
          {/if}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 items-center flex justify-center">
        <a href="/settings">Settings</a>
      </PopoverContent>
    </Popover>
  </div>
</header>

<ModeWatcher />
<slot />
