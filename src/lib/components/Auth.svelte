<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
  import { Button } from "$lib/components/UI/button";
  import { Input } from "$lib/components/UI/input";
  import type { AuthError } from '@supabase/supabase-js';

  let email = '';
  let password = '';
  let isSignUp = false;
  let error: AuthError | null = null;
  let loading = false;

  async function handleSubmit() {
    if (!email || !password) return;

    loading = true;
    error = null;

    try {
      if (isSignUp) {
        error = await authStore.signUp(email, password);
      } else {
        error = await authStore.signIn(email, password);
      }
    } catch (e) {
      console.error('Auth error:', e);
      error = e as AuthError;
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    error = null;
  }
</script>

<div class="flex min-h-[calc(100vh-14rem)] items-center justify-center">
  <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div class="flex flex-col space-y-2 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">
        {isSignUp ? 'Create an account' : 'Welcome back'}
      </h1>
      <p class="text-sm text-muted-foreground">
        {isSignUp 
          ? 'Enter your email below to create your account' 
          : 'Enter your email below to sign in to your account'}
      </p>
    </div>

    <div class="grid gap-6">
      <form on:submit|preventDefault={handleSubmit} class="grid gap-4">
        <div class="grid gap-2">
          <div class="grid gap-1">
            <label for="email" class="sr-only">Email</label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              bind:value={email}
              disabled={loading}
              required
            />
          </div>
          <div class="grid gap-1">
            <label for="password" class="sr-only">Password</label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              bind:value={password}
              disabled={loading}
              required
            />
          </div>
        </div>
        {#if error}
          <div class="text-sm text-destructive">
            {error.message}
          </div>
        {/if}
        <Button type="submit" disabled={loading}>
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {:else}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          {/if}
        </Button>
      </form>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
      </div>

      <Button variant="outline" type="button" on:click={toggleMode}>
        {isSignUp ? 'Sign In' : 'Create Account'}
      </Button>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 100px);
  }
</style> 