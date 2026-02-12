<script lang="ts">
	import ThreadCard from '$lib/components/thread-card.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.username}'s Threads — ThreadCast</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-8 animate-fade-in">
		<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Profile</p>
		<h1 class="mb-2 text-3xl font-bold text-text">
			{data.username}
		</h1>
		<p class="text-text-secondary">
			{data.threads.length}
			{data.threads.length === 1 ? 'thread' : 'threads'} shared
		</p>
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
