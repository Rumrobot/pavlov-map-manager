<script>
  import { cn } from "$lib/utils";

  export let value = 0;
  export let throttled = false;
  export let indeterminate = false;

  let transformBar = "0%";

  $: if (!indeterminate) {
    let throttledVal = throttled ? Math.floor(value / 4) * 4 : value;
    let newTransform = `${throttledVal}%`;
    if (transformBar !== newTransform) {
      transformBar = newTransform;
    }
  } else {
    transformBar = "100%";
  }

  let className = "";
  export { className as class };
</script>

<div class={cn("linear-progress", className)}>
  <span
    class="bar {indeterminate && 'animate-pulse'}"
    style="transform: translateX(calc(-100% + {transformBar}));"
  />
</div>

<style>
  .linear-progress {
    position: relative;
    overflow: hidden;
    display: block;
    height: 4px;
    z-index: 0;
  }

  .linear-progress .bar {
    background-color: black;
    width: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    top: 0;
    transition: transform 0.2s ease-in-out;
    transform-origin: left;
  }
</style>
