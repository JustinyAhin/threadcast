<script lang="ts">
	import ThreadCard from '$lib/components/ThreadCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.username}'s Threads — ThreadCast</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-text">
			{data.username}
		</h1>
		<p class="text-text-secondary">
			{data.threads.length}
			{data.threads.length === 1 ? 'thread' : 'threads'} shared
		</p>
	</div>

	{#if data.threads.length === 0}
		<div class="rounded-lg border border-border bg-bg-secondary p-12 text-center">
			<p class="text-text-secondary">No threads from this user yet</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each data.threads as thread (thread.id)}
				<ThreadCard {thread} />
			{/each}
		</div>
	{/if}
</div>
