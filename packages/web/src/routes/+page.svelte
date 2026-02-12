<script lang="ts">
	import ThreadCard from '$lib/components/thread-card.svelte';

	let { data } = $props();
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-text">Recent Threads</h1>
		<p class="text-text-secondary">Claude Code sessions shared by the community</p>
	</div>

	{#if data.threads.length === 0}
		<div class="rounded-lg border border-border bg-bg-secondary p-12 text-center">
			<p class="mb-2 text-lg text-text-secondary">No threads yet</p>
			<p class="text-sm text-text-muted">
				Share your first session with <code class="rounded bg-bg-tertiary px-1.5 py-0.5"
					>threadcast share</code
				>
			</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each data.threads as thread (thread.id)}
				<ThreadCard {thread} />
			{/each}
		</div>
	{/if}
</div>
