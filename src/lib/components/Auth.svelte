<script>
    import { authStore } from '../stores/authStore';
    
    let email = '';
    let password = '';
    let loading = false;
    let error = null;

    async function handleSubmit(event) {
        event.preventDefault();
        loading = true;
        error = null;

        try {
            await authStore.signIn(email, password);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleSignUp() {
        loading = true;
        error = null;

        try {
            await authStore.signUp(email, password);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="auth-container">
    <form on:submit={handleSubmit}>
        <h2>Login</h2>
        
        {#if error}
            <div class="error">{error}</div>
        {/if}

        <div class="form-group">
            <label for="email">Email:</label>
            <input
                id="email"
                type="email"
                bind:value={email}
                required
            />
        </div>

        <div class="form-group">
            <label for="password">Password:</label>
            <input
                id="password"
                type="password"
                bind:value={password}
                required
            />
        </div>

        <div class="button-group">
            <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button type="button" on:click={handleSignUp} disabled={loading}>
                Sign Up
            </button>
        </div>
    </form>
</div>

<style>
    .auth-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: var(--card-bg);
        border-radius: 8px;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .error {
        color: #ff3e00;
        margin-bottom: 1rem;
    }

    .button-group {
        display: flex;
        gap: 1rem;
    }

    button {
        flex: 1;
    }
</style> 