<script lang="ts">
	import type { ProcessedTurn } from '@threadcast/shared';
	import { renderMarkdown } from '$lib/markdown';

	let { turn }: { turn: ProcessedTurn } = $props();

	const textContent = $derived(
		turn.content
			.filter((b) => b.type === 'text')
			.map((b) => (b as { type: 'text'; text: string }).text)
			.join('\n\n')
	);
</script>

<div class="rounded-lg border border-indigo-500/20 bg-user-bg p-5">
	<div class="mb-2 flex items-center gap-2 text-xs text-text-muted">
		<span class="font-semibold text-indigo-400">User</span>
		{#if turn.timestamp}
			<span>&middot;</span>
			<span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
		{/if}
	</div>
	<div class="prose text-sm text-text">
		{@html renderMarkdown(textContent)}
	</div>
</div>
