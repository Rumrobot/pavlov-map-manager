import type { Mod, LocalMod } from '$lib/types';

export const localMods: Record<string, LocalMod> = $state({});

export const subscribedMods: Record<string, Mod> = $state({});

export const app: {
	status: string;
	loaded: boolean;
} = $state({
	status: "Initializing",
	loaded: false
});