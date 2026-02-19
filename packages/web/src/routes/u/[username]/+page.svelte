<script lang="ts">
	import ThreadCard from '$lib/components/thread-card.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.username}'s Threads — ThreadCast</title>
</svelte:head>

<div class="px-6 py-10">
	<div class="mx-auto max-w-4xl">
		<!-- Back to home -->
		<a
			href="/"
			class="mb-8 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			ThreadCast
		</a>

		<!-- Profile header -->
		<div class="mb-8 animate-fade-in">
			<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Profile</p>

			<div class="flex items-start gap-4">
				{#if data.profile?.image}
					<img
						src={data.profile.image}
						alt={data.username}
						class="h-16 w-16 rounded-full ring-2 ring-border"
					/>
				{/if}

				<div class="min-w-0">
					<h1 class="mb-1 text-3xl font-bold text-text">
						{data.username}
					</h1>

					{#if data.profile?.githubBio}
						<p class="mb-2 text-text-secondary">{data.profile.githubBio}</p>
					{/if}

					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
						<span>
							{data.threads.length}
							{data.threads.length === 1 ? 'thread' : 'threads'} shared
						</span>

						{#if data.profile?.githubLocation}
							<span class="flex items-center gap-1">
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
									/>
								</svg>
								{data.profile.githubLocation}
							</span>
						{/if}

						{#if data.profile?.githubBlog}
							<a
								href={data.profile.githubBlog.startsWith('http')
									? data.profile.githubBlog
									: `https://${data.profile.githubBlog}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-1 transition-colors hover:text-accent"
							>
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.94 8.341"
									/>
								</svg>
								{data.profile.githubBlog.replace(/^https?:\/\//, '')}
							</a>
						{/if}

						<a
							href="https://github.com/{data.username}"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-1 transition-colors hover:text-accent"
						>
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
								/>
							</svg>
							GitHub
						</a>
					</div>
				</div>
			</div>
		</div>

		{#if data.threads.length === 0}
			<div class="rounded-lg border border-border bg-surface-1 p-12 text-center">
				<p class="text-text-secondary">No threads from this user yet</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each data.threads as thread, i (thread.id)}
					<div class="animate-slide-up" style="--delay: {Math.min(i * 60, 400)}ms">
						<ThreadCard {thread} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
