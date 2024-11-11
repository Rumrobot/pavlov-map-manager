import type { Mod, LocalMod } from '$lib/types';

export let localMods: Record<string, LocalMod> = $state({});

export let subscribedMods: Record<string, Mod> = $state({});
