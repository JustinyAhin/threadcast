<script lang="ts">
	import Header from '$lib/components/header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>
	<footer class="border-t border-border px-6 py-6">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<div class="flex items-center gap-2 text-sm text-text-muted">
				<span class="text-accent">&#9672;</span>
				<span>Thread<span class="text-accent">Cast</span></span>
			</div>
			<div class="flex items-center gap-4 text-xs text-text-muted">
				<a href="/changelogs" class="transition-colors hover:text-text">Changelog</a>
				<span class="hidden sm:inline">Share your Claude Code sessions</span>
			</div>
		</div>
	</footer>
</div>
