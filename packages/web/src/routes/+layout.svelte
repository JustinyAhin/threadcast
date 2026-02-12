<script lang="ts">
	import Header from '$lib/components/header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>ThreadCast — Share Claude Code Sessions</title>
	<meta name="description" content="Share your Claude Code sessions as readable web pages." />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<footer class="border-t border-border px-6 py-6">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<div class="flex items-center gap-2 text-sm text-text-muted">
				<span class="text-accent">&#9672;</span>
				<span>Thread<span class="text-accent">Cast</span></span>
			</div>
			<div class="flex items-center gap-4 text-xs text-text-muted">
				<span class="hidden sm:inline">Share your Claude Code sessions</span>
			</div>
		</div>
	</footer>
</div>
