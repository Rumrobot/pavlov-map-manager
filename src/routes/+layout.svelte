<script>
	import '../app.pcss';
	import { ModIoCog } from '$lib/Icons';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { Button } from '$components/ui/button';
	import { X, Minus, Maximize, Minimize, Menu, RotateCw } from '@o7/icon/lucide';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const Window = getCurrentWindow();
	let maximized = $state(false);

	const { children } = $props();
	$inspect(maximized).with(console.log);
	const resize = async () => {
		maximized = await Window.isMaximized();
		console.log(maximized);
	}

	onMount(async () => {
		await resize();
	});
</script>

<ModeWatcher defaultMode="system" />
<Toaster position="top-right" />
<svelte:window on:resize={resize} />

<div class="fixed top-0 border-b w-full h-12 flex justify-between items-center bg-background/75 backdrop-blur"
		 data-tauri-drag-region>
	<div class="flex items-center">
		<Button variant="ghost" size="icon" class="rounded-none" onclick={() => goto("/")}>
			<ModIoCog />
		</Button>
		<Button variant="ghost" size="icon" class="rounded-none">
			<RotateCw />
		</Button>
	</div>
	<div class="flex items-center">
		<Button variant="ghost" size="icon" class="rounded-none">
			<Menu />
		</Button>
		<Button variant="ghost" size="icon" class="rounded-none" onclick={() => Window.minimize()}>
			<Minus />
		</Button>
		<Button variant="ghost" size="icon" class="rounded-none" onclick={() => Window.toggleMaximize()}>
			{#if maximized}
				<Minimize />
			{:else}
				<Maximize />
			{/if}
		</Button>
		<Button variant="ghost" size="icon" class="rounded-none hover:bg-destructive" onclick={() => Window.close()}>
			<X />
		</Button>
	</div>
</div>

<!-- h-[calc(100%-50px)] can be used, if the site has a navbar -->
<div class="mt-12">
	{@render children()}
</div>
