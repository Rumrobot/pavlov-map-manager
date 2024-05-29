import { persistentStore, serverList } from "$lib/stores";
import type { Filters, ServerList } from "$lib/types";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

let previousSort = "";
let fullServerList: ServerList;

export const gamemodes = ["CUSTOM", "SND", "PUSH", "TTT", "TTTclassic", "TDM", "DM", "TANKTDM", "GUN", "WW2GUN", "HIDE", "OITC", "INFECTION", "ZMW", "KOTH", "PH"];

export const getServerList = async (version: string = "pc") => {
    let url: string;
    let servers: ServerList = [];

    if (version == "shack") {
        url = "https://prod-shack-pavlov-ms.vankrupt.net/servers/v2/list/1.0.17/oculus/0/0/0/all";
    } else if (version == "pc") {
        url = "https://prod-crossplay-pavlov-ms.vankrupt.net/servers/v2/list/1.0.17/steam/0/0/0/all";
    }

    const response = await fetch(url);

    if (!response.ok) {
        toast.error("Failed to fetch server list");
        console.error("Failed to fetch server list: ", response);
        return;
    }

    const data = await response.json();

    for (const server of data.servers) {
        servers.push({
            name: server.name,
            players: server.slots,
            maxPlayers: server.maxSlots,
            map: server.mapLabel,
            gamemode: server.gameMode,
            locked: server.bPasswordProtected,
        });
    }

    fullServerList = servers;
    previousSort = "players";
    await filterServerList();
};

export const toggleFavorite = async (name: string) => {
    let favoriteServers: string[] = await persistentStore.get("favorite_servers");

    if (!favoriteServers.includes(name)) {
        favoriteServers.push(name);
    } else if (favoriteServers.includes(name)) {
        favoriteServers = favoriteServers.filter((server) => server !== name);
    }
    await persistentStore.set("favorite_servers", favoriteServers);
}

export const getTotalPlayers = () => {
    let totalPlayers = 0;

    for (const server of fullServerList) {
        totalPlayers += server.players;
    }

    return totalPlayers;
}

export const sortServerList = async (sortType: string = "players") => {
    let servers: ServerList = get(serverList);
    const favoriteServers: string[] = await persistentStore.get("favorite_servers");

    let favorites: ServerList = [];

    for (const server of servers) {
        if (favoriteServers.includes(server.name)) {
            favorites.push(server);
        }
    }

    switch (sortType) {
        case "players":
            servers = servers.sort((a, b) => b.players - a.players);
            favorites = favorites.sort((a, b) => b.players - a.players);
            break;
        case "name":
            servers = servers.sort((a, b) => a.name.localeCompare(b.name));
            favorites = favorites.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "map":
            servers = servers.sort((a, b) => a.map.localeCompare(b.map));
            favorites = favorites.sort((a, b) => a.map.localeCompare(b.map));
            break;
        case "gamemode":
            servers = servers.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
            favorites = favorites.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
            break;
    }

    if (sortType === previousSort) {
        servers.reverse();
        favorites.reverse();
        previousSort = "";
    } else {
        previousSort = sortType;
    }

    servers = [...new Set([...favorites, ...servers])];
    serverList.set(servers);
}

export const filterServerList = async () => {
    let servers = fullServerList;
    const favoriteServers: string[] = await persistentStore.get("favorite_servers");
    const filters: Filters = await persistentStore.get("server_filters");
    let filteredServers: ServerList = [];
    let filterGamemodes: string[] = [];
    for (const gamemode of gamemodes) {
        if (filters.gamemodes[gamemode]) {
            filterGamemodes.push(gamemode);
        }
    }
    if (filterGamemodes.length == 0) filterGamemodes = gamemodes;

    for (const server of servers) {
        let push = true;

        if (filters.favorites && !favoriteServers.includes(server.name)) {
            push = false;
        }
        if (filters.locked && server.locked) {
            push = false;
        }
        if (filters.full && server.players >= server.maxPlayers) {
            push = false;
        }
        if (filters.empty && server.players <= 0) {
            push = false;
        }

        if (!filterGamemodes.includes(server.gamemode)) {
            push = false;
        }

        if (push) filteredServers.push(server);
    }

    serverList.set(filteredServers);
    const sort = previousSort;
    previousSort = "";
    await sortServerList(sort);
}