<script lang="ts">
	import { page } from '$app/state';
	import { authClient } from '$lib/client/auth';
	import Logo from '$lib/components/logo.svelte';

	const session = authClient.useSession();

	const signOut = async () => {
		await authClient.signOut();
		window.location.href = '/threads';
	};
</script>

<header class="border-b border-border px-4 py-4 sm:px-6">
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
		<a href="/" class="group flex shrink-0 items-center gap-2 text-lg font-semibold text-text">
			<span class="transition-transform duration-200 group-hover:scale-110">
				<Logo size="sm" />
			</span>
			<span>Thread<span class="text-accent">Cast</span></span>
		</a>
		<nav class="flex items-center gap-2 text-sm sm:gap-4">
			<a
				href="/threads"
				class="transition-colors {page.url.pathname.startsWith('/threads')
					? 'text-text'
					: 'text-text-secondary hover:text-text'}"
			>
				Threads
			</a>
			<!-- <a
				href="/changelogs"
				class="transition-colors {page.url.pathname.startsWith('/changelogs')
					? 'text-text'
					: 'text-text-secondary hover:text-text'}"
			>
				Changelog
			</a> -->

			<span class="text-border">|</span>

			{#if $session.data}
				<div class="flex items-center gap-3">
					{#if $session.data.user.image}
						<a href="/u/{$session.data.user.name}" class="flex items-center gap-2">
							<img
								src={$session.data.user.image}
								alt={$session.data.user.name}
								class="h-6 w-6 rounded-full ring-1 ring-border"
							/>
							<span class="hidden text-text-secondary transition-colors hover:text-text sm:inline"
								>{$session.data.user.name}</span
							>
						</a>
					{:else}
						<a
							href="/u/{$session.data.user.name}"
							class="text-text-secondary transition-colors hover:text-text"
						>
							{$session.data.user.name}
						</a>
					{/if}
					<button
						onclick={signOut}
						class="cursor-pointer text-text-muted transition-colors hover:text-text"
					>
						Sign out
					</button>
				</div>
			{:else}
				<a
					href="/login"
					class="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
				>
					Sign in
				</a>
			{/if}
		</nav>
	</div>
</header>
