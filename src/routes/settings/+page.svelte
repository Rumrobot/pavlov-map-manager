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
  import { Input } from "$components/ui/input/";
  import { Label } from "$components/ui/label";
  import { Switch } from "$components/ui/switch";
  import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "$components/ui/tooltip";
  import { Button } from "$lib/components/ui/button";
  import { changeOauthToken, getModsPath } from "$lib/modio-utils";
  import { persistentStore } from "$lib/stores";
  import { getVersion } from '@tauri-apps/api/app';
  import { setMode } from "mode-watcher";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  let new_oauth_token: string;
  let new_mods_path: string;
  let oauth_token: string;
  let mods_path: string;
  let auto_path: boolean;
  let theme: string;
  let delete_popup: boolean;
  let show_type: boolean;
  let app_version: string;

  onMount(async () => {
    theme = (await persistentStore.get("theme")) as string;
    oauth_token = await persistentStore.get("oauth_token");
    mods_path = await persistentStore.get("mods_path");
    auto_path = await persistentStore.get("auto_path");
    delete_popup = await persistentStore.get("delete_popup");
    show_type = await persistentStore.get("show_type");
    app_version = await getVersion();
  });

  async function setTheme(new_theme: string) {
    setMode(new_theme as "dark" | "light" | "system");
    await persistentStore.set("theme", new_theme);

    config.save();
    theme = new_theme;
  }

  async function change_mods_path(input: string) {
    await persistentStore.set("mods_path", input);
    mods_path = input;
    await persistentStore.save();
    toast.success("Mods path changed successfully");
  }

  const delete_popup_switch = async () => {
    await persistentStore.get("deletePopup");
    await persistentStore.set("deletePopup", delete_popup);
    await persistentStore.save();
  };

  const show_type_switch = async () => {
    await persistentStore.get("show_type");
    await persistentStore.set("show_type", show_type);
    await persistentStore.save();
  };
</script>

<div class="page-container flex flex-col justify-center items-center m-5">
  <div class="flex flex-col gap-y-5">
    <div class="gap-3 items-center flex">
      <Switch bind:checked={show_type} on:click={show_type_switch} />
      <Label>Show map/mod type</Label>
    </div>
    <div class="gap-3 items-center flex">
      <Switch bind:checked={delete_popup} on:click={delete_popup_switch} />
      <Label>Confirm popup on map deletion</Label>
    </div>
    <div class="flex flex-col gap-y-1.5 justify-start items-start">
      <Label>Theme</Label>
      <div class="flex flex-row gap-x-2">
        <Button disabled={theme === "dark"} on:click={() => setTheme("dark")}>
          Dark
        </Button>
        <Button disabled={theme === "light"} on:click={() => setTheme("light")}>
          Light
        </Button>
      </div>
    </div>
    <div class="flex flex-col gap-y-1.5 justify-start items-start">
      <Label>Mod.io OAuth token</Label>
      <div class="flex flex-row gap-x-1">
        <Input
          placeholder={oauth_token == null ? "Token" : oauth_token}
          bind:value={new_oauth_token}
        ></Input>
        <AlertDialog>
          <AlertDialogTrigger asChild let:builder>
            <Button builders={[builder]} variant="outline">Confirm</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the
                old OAuth token from the application. If you dont have it
                written down, then it will be lost forever.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                on:click={() => changeOauthToken(new_oauth_token)}
                >Confirm</AlertDialogAction
              >
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    <div class="flex flex-col gap-1.5 justify-start items-start w-full">
      <Label>Path to mods folder</Label>
      <Tooltip>
        <TooltipTrigger class="w-full">
          <Input
            placeholder={mods_path == null ? "Path" : mods_path}
            bind:value={new_mods_path}
          ></Input>
        </TooltipTrigger>
        <TooltipContent class="flex flex-row gap-1 justify-center items-center">
          <p>Default value:</p>
          <p class="rounded border border-border p-1">
            C:\Users\%user%\AppData\Local\Pavlov\Saved\Mods
          </p>
        </TooltipContent>
      </Tooltip>
      <div class="flex justify-between items-center w-full">
        <Button
          class=""
          variant="default"
          on:click={async () => {
            await change_mods_path(await getModsPath());
          }}>Auto</Button
        >
        <Button
          variant="outline"
          on:click={() => change_mods_path(new_mods_path)}>Confirm</Button
        >
      </div>
    </div>
  </div>
  <p class="mt-12 text-sm text-muted ">
    Pavlov Map Manager v{app_version}
  </p>
</div>
