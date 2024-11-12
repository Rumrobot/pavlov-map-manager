<script lang="ts">
	import type { Mod } from '$lib/types';

	const { id, mod }: { id: string; mod: Mod } = $props();
</script>

<div class="flex-col w-full" {id}>
	<p class="font-bold">
		{mod.title}
	</p>
	<img src={mod.imageUrl} alt={`${mod.title} image`} class="w-full rounded-lg" />
	<div class="flex justify-between">
		<p>
			Button 1
		</p>
		<p>
			Button 2
		</p>
	</div>
</div>