<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$components/ui/card";
  import { invoke } from "@tauri-apps/api/tauri";
  import { onMount } from "svelte";

  let maps: Array<string> = [];
  let map_data: { [key: string]: { title: string; image_url: string } } = {};

  async function get_maps() {
    const path = "%localAppData%\\Pavlov\\Saved\\Mods";
    try {
      maps = await invoke("list_dir", { path });
      console.log("Folders:", maps);
      get_map_data(maps);
      return maps;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  async function get_map_data(maps) {
    await Promise.all(
      maps.map(async (map) => {
        try {
          const response = await fetch(
            `https://api.mod.io/v1/games/3959/mods/${map.split("UGC")[1]}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  "Bearer eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiUlNBLU9BRVAiLCJjdHkiOiJKV1QiLCJ6aXAiOiJERUYiLCJ4NXQiOiJzR0pJLUJhTmhlTDctUjBMejJFdlhhNlQweGs9In0.ARZg5H0AHLWOMRSN011uqCyDBxZFYk-2BorJG28po8LG-NWSUpvQflrBt9WiVxdSHwWWmNwNLoEkopWchh2GiMFwrXEAuSluXQGaxCWT1h4yXF0icsGLo52VvZFXIsedrqWdrJIxyJotoNSZepboMP3rsrCv8gdFfIv4oEFpbT8ZSWAT9-GBIB8DqN0Bgy8aRwM4s6qSiX80KrjmJJ_VGaCDIQ2j8xEGPrx83pFFfFRoryCrZmkiiFSgaZOpWIWptSuLYyWG0fUobTB_hlMBtxUJCG0t6LJva0S7LL8doTKfcKm0xlW1eGwMpALyG3hq-W-Sg-OkdEGn3p3Z7Z0aSw.KL-KpBjrUFfh-WHm84lNmQ.dNe16GgN7m0luxmZ8WaUHdJxbnF5OZl6p8wNAX01741iA8bLAMLUck2PH6rdKGAMXxKRv2TI5Qr55l9ggz85ehpA_N0D9Uac6klmneo0qKrUo59hCLjnnTx57G_ZX9B68oT6ZBqwWD1hxFJpt6nsFzMtjIsst1b71MOyF7oGeXJUA3LRHM-6h84hFngnl9zvgYvV8c6DSdIWdgsMTmfqtxRlrlhWMuaFObm69Qo_u67kwJgkhiL-pfA9AYpJG3w7R_65GyKDXlBagE-s-qdD8t07VlmDC_VibBaLHhSwQ-3if9WEIRFJcJ9X7i3HRHeVsQn0G0hRWnpDMmF-agMC0IgngCmDU4X_bHFT0rf47c-ZdQNIS19FkOFITaXeBrOlZnLAnOx2Tkv1wrX-faKlqaxfhEVPViEWqlGtTLxSRfgDxkNnQnxmM_TrlQ26Mr0Bmb6W61GtBOc1t4HqmoefvwPww6DnqeIbHyE0-RAvx3ZD4i8YnscQoXaC45oKlQXPjldWe4ky9un5d6D0gniB0R_WzqcYORV0qGYO326xg7ueA30xxPhj3bCzht65OFSaFwYAdQJjAKbSS1uFHvR_zUvR9Yenbk6DMbNZtJcHELC5PNh3FqAeoZAztpAfAoiFOpZdnqwfftruICbCqgGVd57lvRlzKm-1_6aTacGW4bihzkWXYL-jxx-eZzuySM0Zb9j1LeXlyJzHBqKZG8schEiNrEkzlWWV1hR-RU7fJKdblv14KVUYHtyd4DTNLZA9GFqengpHrtrB0CRfapl0R6jmPXXfHdmYGtXNZ13zEM6nIL_CWKX-r1opIItlJY-7P7Lkohs1ym4YgzFt4pX_03JvTZSefAhKqc3cV1-dSWmYNU__JDByDb2eNw3HYWD0iqcBoC9QOJTpLxwGQTDILYoZ8WQUviRI4BL_cfGNO9cKSWhlDXnVxpewVCf99xkoD9nSLAIP8DpXZqBvPd2DRpLwiQpf9QC38MNqwAE-MJBQwKAPoPUIZhMAPO8sFlMLaK8WMjRRFqRzEle0S6Y8pQ.qArjTYUubAivZbQnSI11FQ",
              },
            }
          );
          const data = await response.json();
          map_data[map] = {
            title: data.name,
            image_url: data.logo.thumb_1280x720,
          };
        } catch (error) {
          console.error("Error:", error);
          map_data[map] = {
            title: map,
            image_url: "https://www.freeiconspng.com/uploads/error-icon-4.png",
          };
        }
      })
    );
  }

  onMount(async () => {
    await get_maps();
  });
</script>

<div class="flex justify-center items-center">
  {#if maps.length > 0}
    <div
      class="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      {#each Object.entries(map_data) as [_, map]}
        <Card class="m-1 items-end text-center">
          <CardHeader>
            <CardTitle class="text-2xl">{map.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={map.image_url} alt={map.title} class="rounded-t-md" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else}
    <p>No maps found</p>
  {/if}
</div>
