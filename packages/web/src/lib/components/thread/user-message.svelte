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

<div class="flex gap-3">
	<div
		class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-600/20 font-mono text-xs text-cyan-400"
	>
		U
	</div>
	<div class="min-w-0 flex-1">
		<div class="rounded-lg border-l-2 border-l-cyan-600/40 bg-user-bg px-5 py-4">
			<div class="mb-2 flex items-center gap-2 text-xs text-text-muted">
				<span class="font-semibold text-cyan-400">User</span>
				{#if turn.timestamp}
					<span>&middot;</span>
					<span class="font-mono">{new Date(turn.timestamp).toLocaleTimeString()}</span>
				{/if}
			</div>
			<div class="prose text-sm text-text">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html renderMarkdown(textContent)}
			</div>
		</div>
	</div>
</div>
