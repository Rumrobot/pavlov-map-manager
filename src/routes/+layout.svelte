<script>
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	const { children } = $props();

	// Change the title of the page here

</script>

<ModeWatcher defaultMode="system" />
<Toaster position="top-right" />

<!-- h-[calc(100%-50px)] can be used, if the site has a navbar -->
{@render children()}
