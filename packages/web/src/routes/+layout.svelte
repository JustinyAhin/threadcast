<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>ThreadCast — Share Claude Code Sessions</title>
	<meta name="description" content="Share your Claude Code sessions as readable web pages." />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex-1 px-6 py-8">
		{@render children()}
	</main>
	<footer class="border-t border-border px-6 py-4 text-center text-xs text-text-muted">
		ThreadCast &mdash; Share your Claude Code sessions
	</footer>
</div>
