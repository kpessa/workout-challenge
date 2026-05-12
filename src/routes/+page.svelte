<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import type { PageData } from './$types';
  
  export let data: PageData;
  export let form: Record<string, unknown> | undefined = undefined;
</script>

<Layout />
