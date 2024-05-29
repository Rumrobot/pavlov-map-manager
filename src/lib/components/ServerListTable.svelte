<script lang="ts">
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$components/ui/table";
  import {
    DropdownMenu,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
  } from "$components/ui/dropdown-menu";
  import { Separator } from "$components/ui/separator";
  import { ArrowUpDown, Lock, RefreshCw, Star } from "lucide-svelte";
  import { Button } from "$components/ui/button";
  import { serverList } from "$lib/stores";
  import {
    getServerList,
    toggleFavorite,
    getTotalPlayers,
    sortServerList,
    filterServerList,
    gamemodes,
  } from "$lib/pavlov-utils";
  import { Store } from "tauri-plugin-store-api";
  import { onMount } from "svelte";
  import type { Filters } from "$lib/types";

  let config = new Store(".config.dat");

  let theme: string;
  let favoriteServers: string[];
  let filters: Filters;
  let totalPlayers: number;

  let tableReloading = false;
  let version = "pc";

  const reload = async () => {
    tableReloading = true;
    await getServerList(version);
    totalPlayers = getTotalPlayers();
    tableReloading = false;
  };

  const setFilters = async () => {
    await config.get("server_filters");
    await config.set("server_filters", filters);
    await filterServerList();
  };

  onMount(async () => {
    theme = await config.get("theme");
    favoriteServers = await config.get("favorite_servers");
    filters = await config.get("server_filters");

    await reload();
  });
</script>

<div class="p-4 flex justify-between gap-2 items-center">
  <div class="flex gap-2">
    <Button
      disabled={version == "pc"}
      on:click={() => {
        version = "pc";
        reload();
      }}>PC</Button
    >
    <Button
      disabled={version == "shack"}
      on:click={() => {
        version = "shack";
        reload();
      }}>Shack</Button
    >
  </div>
  <p>
    Players online: {totalPlayers}
  </p>
  <div class="flex gap-2">
    <DropdownMenu closeOnItemClick={false}>
      <DropdownMenuTrigger asChild let:builder>
        <Button variant="outline" builders={[builder]}>Filters</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="overflow-y-auto max-h-96 ">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tools</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            bind:checked={filters.full}
            on:click={setFilters}>Hide Full</DropdownMenuCheckboxItem
          >
          <DropdownMenuCheckboxItem
            bind:checked={filters.empty}
            on:click={setFilters}>Hide Empty</DropdownMenuCheckboxItem
          >
          <DropdownMenuCheckboxItem
            bind:checked={filters.locked}
            on:click={setFilters}>Hide Locked</DropdownMenuCheckboxItem
          >
          <DropdownMenuCheckboxItem
            bind:checked={filters.favorites}
            on:click={setFilters}>Only Favorites</DropdownMenuCheckboxItem
          >
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Gamemodes</DropdownMenuLabel>
          {#each gamemodes as gamemode}
            <DropdownMenuCheckboxItem
              bind:checked={filters.gamemodes[gamemode]}
              on:click={setFilters}
            >
              {gamemode}
            </DropdownMenuCheckboxItem>
          {/each}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button on:click={() => reload()} variant="outline">
      <RefreshCw class={tableReloading ? "animate-spin" : ""} />
    </Button>
  </div>
</div>
<Separator />
<div class="rounded-md border p-4 justify-center">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead></TableHead>
        <TableHead
          ><Button
            class="gap-1 text-lg"
            variant="ghost"
            on:click={() => sortServerList("name")}
          >
            Server <ArrowUpDown /></Button
          ></TableHead
        >
        <TableHead
          ><Button
            class="gap-1"
            variant="ghost"
            on:click={() => sortServerList("map")}>Map <ArrowUpDown /></Button
          ></TableHead
        >
        <TableHead
          ><Button
            class="gap-1"
            variant="ghost"
            on:click={() => sortServerList("players")}
            >Players <ArrowUpDown /></Button
          ></TableHead
        >
        <TableHead
          ><Button
            class="gap-1"
            variant="ghost"
            on:click={() => sortServerList("gamemode")}
            >Gamemode <ArrowUpDown /></Button
          ></TableHead
        >
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each $serverList as server}
        <TableRow class="">
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              on:click={async () => {
                await toggleFavorite(server.name);
                favoriteServers = await config.get("favorite_servers");
              }}
            >
              <Star
                fill={favoriteServers.includes(server.name)
                  ? theme == "dark"
                    ? "#f5f5f7"
                    : "#18181b"
                  : "none"}
              /></Button
            >
          </TableCell>
          <TableCell class="max-w-64">
            <div class="flex gap-1.5 items-center">
              {#if server.locked}
                <Lock size="16" />
              {/if}
              <p class="truncate">
                {server.name}
              </p>
            </div>
          </TableCell>
          <TableCell>
            {server.map}
          </TableCell>
          <TableCell>
            {server.players}/{server.maxPlayers}
          </TableCell>
          <TableCell>
            {server.gamemode}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
