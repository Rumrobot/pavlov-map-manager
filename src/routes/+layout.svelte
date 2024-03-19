<script lang="ts">
  import { Button } from "$components/ui/button";
  import { ArrowBigLeft, Menu } from "lucide-svelte";
  import "../app.pcss";
  import { ModeWatcher } from "mode-watcher";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "$components/ui/popover";
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
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80">
        <a href="/settings">Settings</a>
      </PopoverContent>
    </Popover>
  </div>
</header>

<ModeWatcher />
<slot />
