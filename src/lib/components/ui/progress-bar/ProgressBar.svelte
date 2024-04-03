<script>
  import { cn } from "$lib/utils";

  export let value = 0;
  export let throttled = false;
  export let indeterminate = false;

  let transformBar = "0%";

  $: {
    let throttledVal = throttled ? Math.floor(value / 4) * 4 : value;
    let newTransform = `${throttledVal}%`;
    if (transformBar !== newTransform) {
      transformBar = newTransform;
    }
  }

  let className = "";
  export { className as class };
</script>

<div class={cn("relative overflow-hidden rounded-md block h-1 z-0", className)}>
  <span
    class="bg-foreground rounded-md w-full absolute left-0 bottom-0 top-0 [transition:transform_0.1s_ease-in-out] origin-left {indeterminate &&
      'animate-pulse'}"
    style="transform: translateX(calc(-100% + {transformBar}));"
  />
</div>
