<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
  import { Button } from './button';
  import { Sun, Moon } from 'lucide-svelte';
</script>

<Button
  variant="ghost"
  size="icon"
  on:click={() => theme.toggle()}
  class="text-foreground"
>
  {#if $theme === 'dark'}
    <Sun class="h-4 w-4" />
  {:else}
    <Moon class="h-4 w-4" />
  {/if}
  <span class="sr-only">Toggle theme</span>
</Button> 