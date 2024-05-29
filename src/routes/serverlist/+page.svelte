<script lang="ts">
  import { ServerListTable } from "$components";
  import { getServerList } from "$lib/pavlov-utils";
  import { onMount } from "svelte";

  onMount(async () => {
    getServerList();
  });
</script>

<ServerListTable />
