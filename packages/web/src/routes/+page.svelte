<script lang="ts">
	import ThreadCard from '$lib/components/thread-card.svelte';

	let { data } = $props();
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-10 animate-fade-in">
		<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">
			Claude Code Sessions
		</p>
		<h1 class="mb-3 text-4xl font-bold text-text">Conversations worth reading.</h1>
		<p class="max-w-lg text-text-secondary">
			Real coding sessions with Claude — shared by developers, preserved for everyone.
		</p>
	</div>

	{#if data.threads.length === 0}
		<div class="rounded-lg border border-border bg-surface-1 p-12 text-center">
			<p class="mb-2 text-lg text-text-secondary">No threads yet</p>
			<p class="text-sm text-text-muted">
				Share your first session with <code
					class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-accent">threadcast share</code
				>
			</p>
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
