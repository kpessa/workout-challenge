<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/services/supabase';

  onMount(async () => {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error in auth callback:', error);
    }
    // Redirect to home page after successful authentication
    goto('/');
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
</div> 