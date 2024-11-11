<script>
	import '../app.pcss';
	import { ModIoCog } from '$lib/Icons';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { Button } from '$components/ui/button';
  import { Fullscreen, FullscreenExit, Close, Remove, Menu } from '@o7/icon/material';
  import { RefreshCcw, Server } from '@o7/icon/lucide';
	import { goto } from '$app/navigation';
  import { page } from '$app/stores';
	import { onMount } from 'svelte';
  import { cn } from '$lib/utils';

	const { children } = $props();
	const Window = getCurrentWindow();
	let maximized = $state(false);
  let reload = $state(false);

	const resize = async () => {
		maximized = await Window.isMaximized();
	}

	onMount(async () => {
		await resize();
	});
</script>

<ModeWatcher defaultMode="system" />
<Toaster position="top-right" />
<svelte:window on:resize={resize} />

<div class="fixed top-0 border-b w-full h-12 grid grid-cols-5 justify-between items-center bg-background/75 backdrop-blur"
		 data-tauri-drag-region>
	<div class="flex items-center ml-2 gap-1 col-span-2" data-tauri-drag-region>
		<Button variant="ghost" size="icon" onclick={() => {if ($page.url.pathname !== "/") goto("/")}} class={cn("hover:bg-inherit", $page.url.pathname === "/" ? "hover:cursor-default" : "text-muted")}>
			<ModIoCog size={32} />
		</Button>
    <Button variant="ghost" size="icon" onclick={() => {if ($page.url.pathname !== "/servers") goto("/servers")}} class={cn("hover:bg-inherit", $page.url.pathname === "/servers" ? "hover:cursor-default" : "text-muted")}>
      <Server size={24} />
    </Button>
    <div class="h-8 bg-border w-[1px]"></div>
		<Button variant="ghost" size="icon" onclick={() => reload = true}>
			<RefreshCcw class={`animate-spin repeat-1 direction-reverse ease-in ${reload ? "running" : "paused"}`} />
		</Button>
	</div>
  <p class="text-sm text-muted pointer-events-none justify-self-center" data-tauri-drag-region>
  Pavlov Map Manager
  </p>
	<div class="flex items-center h-full col-span-2 justify-self-end" data-tauri-drag-region>
		<Button variant="ghost" size="icon" class="mr-1">
			<Menu />
		</Button>
    <div class="h-full bg-border w-[1px]"></div>
    <div class="h-full flex text-muted">
      <Button variant="ghost" class="px-4 rounded-none h-full" onclick={() => Window.minimize()}>
        <Remove size={18} />
      </Button>
      <Button variant="ghost" class="px-4 rounded-none h-full" onclick={() => Window.toggleMaximize()}>
        {#if maximized}
          <FullscreenExit size={18} />
        {:else}
          <Fullscreen size={18} />
        {/if}
      </Button>
      <Button variant="ghost" class="px-4 rounded-none h-full hover:bg-destructive" onclick={() => Window.close()}>
        <Close size={18} />
      </Button>
    </div>
	</div>
</div>

<div class="mt-12">
	{@render children()}
</div>
