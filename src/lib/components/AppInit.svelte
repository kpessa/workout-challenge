<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { supabase } from '$lib/services/supabase';

  onMount(() => {
    // Initialize auth state
    authStore.initialize();

    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        authStore.initialize();
      } else {
        authStore.signOut();
      }
    });
  });
</script>