<script>
    import { authStore } from '../stores/authStore';
    import { Button } from "$lib/components/UI/button";
    import { Input } from "$lib/components/UI/input";
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/UI/card";
    import { Label } from "$lib/components/UI/label";
    import { Alert, AlertDescription } from "$lib/components/UI/alert";

    let email = '';
    let password = '';
    let isSignUp = false;
    let error = null;
    let loading = false;

    async function handleSubmit() {
        error = null;
        loading = true;
        
        try {
            if (isSignUp) {
                await authStore.signUp(email, password);
            } else {
                await authStore.signIn(email, password);
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-container">
    <Card class="w-[350px]">
        <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
                {isSignUp ? 'Create a new account to track your workouts' : 'Sign in to your account'}
            </CardDescription>
        </CardHeader>
        
        <CardContent>
            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div class="space-y-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        bind:value={email}
                        required
                        placeholder="Enter your email"
                    />
                </div>
                
                <div class="space-y-2">
                    <Label for="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        bind:value={password}
                        required
                        placeholder="Enter your password"
                    />
                </div>

                {#if error}
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                {/if}
                
                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        Loading...
                    {:else}
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    {/if}
                </Button>
            </form>
        </CardContent>

        <CardFooter>
            <Button variant="ghost" class="w-full" on:click={() => isSignUp = !isSignUp}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
        </CardFooter>
    </Card>
</div>

<style>
    .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 100px);
    }
</style> 