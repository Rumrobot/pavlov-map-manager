<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex h-screen flex-col items-center justify-center">
	{#if $page.status === 404}
		<h1 class="text-3xl font-bold">404</h1>
		<p class="text-lg mb-3">The page does not exist</p>
		<Button href="/" variant="outline">Front page</Button>
	{:else}
		<h1 class="text-4xl font-bold">An error has occured</h1>
		<p class="text-lg">{$page.error?.message}</p>
	{/if}
</div>
