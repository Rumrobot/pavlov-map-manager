import type { Filters, ServerList } from "$lib/types";
import { serverList } from "$lib/stores";
import { Store } from "tauri-plugin-store-api";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

const config = new Store(".config.dat");

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
    let favoriteServers: string[] = await config.get("favorite_servers");

    if (!favoriteServers.includes(name)) {
        favoriteServers.push(name);
    } else if (favoriteServers.includes(name)) {
        favoriteServers = favoriteServers.filter((server) => server !== name);
    }
    await config.set("favorite_servers", favoriteServers);
}

export const sortServerList = async (sortType: string = "players") => {
    let servers: ServerList = get(serverList);
    const favoriteServers: string[] = await config.get("favorite_servers");

    let favorites: ServerList = [];

    for (const server of servers) {
        if (favoriteServers.includes(server.name)) {
            favorites.push(server);
        }
    }

    switch (sortType) {
        case "players":
            console.log("player sort")
            servers = servers.sort((a, b) => b.players - a.players);
            favorites = favorites.sort((a, b) => b.players - a.players);
            break;
        case "name":
            console.log("name sort")
            servers = servers.sort((a, b) => a.name.localeCompare(b.name));
            favorites = favorites.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "map":
            console.log("map sort")
            servers = servers.sort((a, b) => a.map.localeCompare(b.map));
            favorites = favorites.sort((a, b) => a.map.localeCompare(b.map));
            break;
        case "gamemode":
            console.log("gamemode sort")
            servers = servers.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
            favorites = favorites.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
            break;
    }

    console.log("Sort types", sortType, previousSort)

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
    const favoriteServers: string[] = await config.get("favorite_servers");
    const filters: Filters = await config.get("server_filters");
    let filteredServers: ServerList = [];

    console.log(filters)

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
        for (const gamemode of gamemodes) {
            if (filters.gamemodes[gamemode] && server.gamemode != gamemode) {
                push = false;
            }
        }

        if (push) filteredServers.push(server);
    }

    serverList.set(filteredServers);
    const sort = previousSort;
    previousSort = "";
    await sortServerList(sort);
}