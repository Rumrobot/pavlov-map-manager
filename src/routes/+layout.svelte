<script lang="ts">
  import { Button } from "$components/ui/button";
  import "../app.pcss";
  import { ModeWatcher } from "mode-watcher";
</script>

<div>
  <Button href="/settings">Settings</Button>
</div>

<ModeWatcher />
<slot />
