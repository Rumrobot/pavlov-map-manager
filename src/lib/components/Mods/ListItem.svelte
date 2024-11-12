<script lang="ts">
	import type { Mod } from '$lib/types';
	import { cn } from '$lib/utils';
	import { Download, Trash2 } from '@o7/icon/lucide';
	import { Star as FilledStar } from '@o7/icon/heroicons/solid';
	import { Star } from '@o7/icon/heroicons';
	import { Button } from '$components/ui/button';

	const { id, mod, class: className }: { id: string; mod: Mod; class: string; } = $props();
</script>

<div class={cn("flex w-full justify-between", className)} {id}>
	<div class="flex items-center gap-2">
		<img src={mod.imageUrl} alt={`${mod.title} image`} class="rounded-lg h-10" />
		<p class="font-bold">
			{mod.title}
		</p>
	</div>
	<div class="flex justify-between items-center gap-2">
		<Button variant="default" size="icon">
			<Download />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => mod.subscribed = !mod.subscribed}>
			{#if mod.subscribed}
				<FilledStar />
			{:else}
				<Star  />
			{/if}
		</Button>
		<Button variant="destructive" size="icon" class="bg-destructive/70">
			<Trash2 />
		</Button>
	</div>
</div>