<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "$components/ui/alert-dialog";
  import { Button } from "$components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$components/ui/card";
  import {
    addDownload,
    deleteMod,
    subscribe,
    unsubscribe,
  } from "$lib/modio-utils";
  import { modsStore, persistentStore, queueStore } from "$lib/stores";
  import { ArrowDownToLine, Star, Trash } from "lucide-svelte";
  import { onMount } from "svelte";

  let theme: string;
  let deletePopup: boolean;
  let showType: boolean;

  onMount(async () => {
    theme = await persistentStore.get("theme");
    deletePopup = await persistentStore.get("delete_popup");
    showType = await persistentStore.get("show_type");
  });

  export let mod: string;
</script>

<Card class="items-center m-1 text-center">
  <CardHeader>
    <CardTitle class="text-2xl truncate">{$modsStore[mod].title}</CardTitle>
  </CardHeader>
  <CardContent>
    {#if showType}
      <p class="flex justify-center mb-1.5 text-lg">{$modsStore[mod].type}</p>
    {/if}
    <button
      on:click={() => open($modsStore[mod].modUrl)}
      role="link"
      tabindex="0"
      class={!showType ? "mt-3" : ""}
    >
      <img
        src={$modsStore[mod].imageUrl}
        alt={$modsStore[mod].title}
        class="rounded-md"
      />
    </button>
    <div class="mt-1.5 flex flex-row justify-between">
      {#if $modsStore[mod].currentVersion != $modsStore[mod].latestVersion}
        <Button
          on:click={() => addDownload(mod)}
          disabled={$queueStore.includes(mod.toString())}
        >
          <ArrowDownToLine />
        </Button>
      {/if}
      <Button
        on:click={() => {
          if ($modsStore[mod].subscribed) {
            unsubscribe(mod);
          } else {
            subscribe(mod);
          }
        }}
      >
        <Star
          fill={$modsStore[mod].subscribed
            ? theme == "dark"
              ? "#18181b"
              : "#f5f5f7"
            : "none"}
        />
      </Button>
      {#if $modsStore[mod].currentVersion != undefined}
        {#if !deletePopup}
          <Button variant="destructive" on:click={() => deleteMod(mod)}>
            <Trash />
          </Button>
        {:else}
          <AlertDialog>
            <AlertDialogTrigger asChild let:builder>
              <Button builders={[builder]} variant="destructive">
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  map: {$modsStore[mod].title}. You can get it back by
                  downloading it again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction on:click={() => deleteMod(mod)}
                  >Confirm</AlertDialogAction
                >
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        {/if}
      {/if}
    </div>
  </CardContent>
</Card>
