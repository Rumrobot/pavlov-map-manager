<script lang="ts">
	import * as Accordion from '$components/ui/accordion';
	import type { Mod } from '$lib/types';
	import { onMount } from 'svelte';
	import { GridItem, ListItem } from '$components/Mods';
	import { app } from '$lib/globals.svelte';

	let localMods: Record<string, Mod> = $state({});

	onMount(async () => {
		localMods = {
			'3870508': {
				title: '[VEH] KENNITHH\'s Modern Vehicles',
				imageUrl: 'https://thumb.modcdn.io/mods/9b1d/3870508/crop_320x180/thumbnail_mod.jpg',
				modUrl: 'https://mod.io/g/pavlov/m/veh-kennithhs-modern-vehicles',
				type: 'mod',
				subscribed: false,
				localVersion: undefined,
				modioVersion: 3870508,
				infected: false,
				corrupted: false
			},
			'3870509': {
				title: '[VEH] KENNITHH\'s Modern Vehicles',
				imageUrl: 'https://thumb.modcdn.io/mods/9b1d/3870508/crop_320x180/thumbnail_mod.jpg',
				modUrl: 'https://mod.io/g/pavlov/m/veh-kennithhs-modern-vehicles',
				type: 'mod',
				subscribed: true,
				localVersion: undefined,
				modioVersion: 3870508,
				infected: false,
				corrupted: false
			},
			'3870518': {
				title: '[VEH] KENNITHH\'s Modern Vehicles',
				imageUrl: 'https://thumb.modcdn.io/mods/9b1d/3870508/crop_320x180/thumbnail_mod.jpg',
				modUrl: 'https://mod.io/g/pavlov/m/veh-kennithhs-modern-vehicles',
				type: 'map',
				subscribed: false,
				localVersion: 3870508,
				modioVersion: 3870508,
				infected: false,
				corrupted: false
			},
			'3870528': {
				title: '[VEH] KENNITHH\'s Modern Vehicles',
				imageUrl: 'https://thumb.modcdn.io/mods/9b1d/3870508/crop_320x180/thumbnail_mod.jpg',
				modUrl: 'https://mod.io/g/pavlov/m/veh-kennithhs-modern-vehicles',
				type: 'mod',
				subscribed: false,
				localVersion: undefined,
				modioVersion: 3870508,
				infected: false,
				corrupted: false
			}
		};
		app.loaded = true;
	});

	$inspect(app).with(console.log);
</script>

<div class="page-container">
	<h1>Welcome to the V2 rewrite of Pavlov Map Manager!</h1>
	<p>Made by Rumrobot</p>
<div class="flex-col flex items-center max-w-[1080px] w-full justify-center">
	{#if app.loaded}
		<Accordion.Root type="multiple" class="w-full" onValueChange={(e) => console.log(e)}>
			<!--<Accordion.Item value="local">
				<Accordion.Trigger>Local mods</Accordion.Trigger>
				<Accordion.Content class="grid grid-cols-3 justify-center">
					{#each Object.entries(localMods) as [id, mod]}
						<GridItem {id} {mod} />
					{/each}
				</Accordion.Content>
			</Accordion.Item>-->
			<Accordion.Item value="local">
				<Accordion.Trigger>Local mods</Accordion.Trigger>
				<Accordion.Content class="flex flex-col justify-center gap-5">
					{#each Object.entries(localMods) as [id, mod], i}

						<ListItem {id} {mod} class={i % 2 ? "bg-muted/15" : "" }/>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{:else}
		Hej
	{/if}
</div>
</div>

