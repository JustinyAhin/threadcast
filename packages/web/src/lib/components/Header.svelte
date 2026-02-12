<script lang="ts">
	import { authClient } from '$lib/auth-client';

	const session = authClient.useSession();

	const signOut = async () => {
		await authClient.signOut();
		window.location.href = '/';
	};
</script>

<header class="border-b border-border px-6 py-4">
	<div class="mx-auto flex max-w-4xl items-center justify-between">
		<a href="/" class="flex items-center gap-2 text-lg font-semibold text-text">
			<span class="text-accent">&#9672;</span>
			ThreadCast
		</a>
		<nav class="flex items-center gap-4 text-sm text-text-secondary">
			<a href="/" class="hover:text-text transition-colors">Threads</a>
			<a
				href="https://github.com/threadcast"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-text transition-colors"
			>
				GitHub
			</a>
			{#if $session.data}
				<div class="flex items-center gap-3">
					{#if $session.data.user.image}
						<img
							src={$session.data.user.image}
							alt={$session.data.user.name}
							class="h-6 w-6 rounded-full"
						/>
					{/if}
					<span class="text-text">{$session.data.user.name}</span>
					<button
						onclick={signOut}
						class="cursor-pointer text-text-muted transition-colors hover:text-text"
					>
						Sign out
					</button>
				</div>
			{:else}
				<a href="/login" class="text-accent transition-colors hover:text-accent/80">Sign in</a>
			{/if}
		</nav>
	</div>
</header>
