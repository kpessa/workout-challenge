<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;
  export let form: any = undefined;

  onMount(async () => {
    // Firebase Auth handles OAuth redirects automatically
    // This page is no longer needed but keeping for compatibility
    goto('/');
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div> 