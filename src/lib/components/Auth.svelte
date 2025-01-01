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
        const signUpError = await authStore.signUp(email, password);
        if (signUpError) error = signUpError;
      } else {
        const signInError = await authStore.signIn(email, password);
        if (signInError) error = signInError;
      }
    } catch (e) {
      console.error('Auth error:', e);
      error = e as AuthError;
    } finally {
      loading = false;
    }
  }

  async function handleGoogleSignIn() {
    try {
      const error = await authStore.signInWithGoogle();
      if (error) {
        console.error('Google sign in error:', error);
      }
    } catch (e) {
      console.error('Failed to sign in with Google:', e);
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
            Or continue with
          </span>
        </div>
      </div>

      <Button variant="outline" type="button" on:click={handleGoogleSignIn} class="flex items-center justify-center gap-2">
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <Button variant="outline" type="button" on:click={toggleMode}>
        {isSignUp ? 'Sign In' : 'Create Account'}
      </Button>
    </div>

    <div class="text-center text-sm text-muted-foreground mt-6">
      By continuing, you agree to our
      <a href="/terms" class="underline underline-offset-4 hover:text-primary">Terms of Service</a>
      and
      <a href="/privacy" class="underline underline-offset-4 hover:text-primary">Privacy Policy</a>
    </div>
  </div>
</div> 