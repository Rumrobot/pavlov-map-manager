<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { setMode } from "mode-watcher";
  import { Store } from "tauri-plugin-store-api";
  import { Input } from "$components/ui/input/";
  import { Label } from "$components/ui/label";
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
  import { changeOauthToken } from "$lib/modio-utils";
  import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "$components/ui/tooltip";
  import { Switch } from "$components/ui/switch";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { getModsPath } from "$lib/modio-utils";

  const config = new Store(".config.dat");
  let new_oauth_token: string;
  let new_mods_path: string;
  let oauth_token: string;
  let mods_path: string;
  let auto_path: boolean;
  let theme: string;
  let delete_popup: boolean;
  let show_type: boolean;

  onMount(async () => {
    theme = (await config.get("theme")) as string;
    oauth_token = await config.get("oauthToken");
    mods_path = await config.get("modsPath");
    auto_path = await config.get("autoPath");
    delete_popup = await config.get("deletePopup");
    show_type = await config.get("show_type");
  });

  async function setTheme(new_theme: string) {
    setMode(new_theme as "dark" | "light" | "system");
    await config.set("theme", new_theme);

    config.save();
    theme = new_theme;
  }

  async function change_mods_path(input: string) {
    await config.set("mods_path", input);
    mods_path = input;
    await config.save();
    toast.success("Mods path changed successfully");
  }

  async function autoPathSwitch() {
    if (!auto_path) {
      await change_mods_path(await getModsPath());
    }
    await config.get("autoPath");
    await config.set("autoPath", auto_path);
    await config.save();
  }

  const delete_popup_switch = async () => {
    await config.get("deletePopup");
    await config.set("deletePopup", delete_popup);
    await config.save();
  };

  const show_type_switch = async () => {
    await config.get("show_type");
    await config.set("show_type", show_type);
    await config.save();
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
    <div class="flex flex-col gap-1.5 justify-start items-start">
      <Label>Path to mods folder</Label>
      <div class="items-center flex gap-1.5">
        <Switch bind:checked={auto_path} on:click={autoPathSwitch}></Switch>
        <Label>Auto path</Label>
      </div>
      <div class="flex flex-row gap-x-1 justify-center items-center">
        <Tooltip>
          <TooltipTrigger>
            <Input
              placeholder={mods_path == null ? "Path" : mods_path}
              bind:value={new_mods_path}
            ></Input>
          </TooltipTrigger>
          <TooltipContent
            class="flex flex-row gap-x-1 justify-center items-center"
          >
            <p>Default value:</p>
            <p class="rounded bg-secondary/20 p-1">
              C:\Users\%user%\AppData\Local\Pavlov\Saved\Mods
            </p>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="outline"
          on:click={() => change_mods_path(new_mods_path)}>Confirm</Button
        >
      </div>
    </div>
  </div>
</div>
