<script lang="ts">
	import type { ProcessedTurn } from '@threadcast/shared';
	import { renderMarkdown } from '$lib/markdown';
	import { highlightProse } from '$lib/actions/highlight-prose';
	import { highlightSearch } from '$lib/actions/highlight-search';
	import ToolCallBlock from './tool-call-block.svelte';

	let { turn, query = '' }: { turn: ProcessedTurn; query?: string } = $props();
</script>

<div class="flex gap-3">
	<div
		class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 font-mono text-xs text-accent"
	>
		A
	</div>
	<div class="min-w-0 flex-1">
		<div class="rounded-lg border-l-2 border-l-accent-dim/40 bg-assistant-bg px-5 py-4">
			<div class="mb-3 flex items-center gap-2 text-xs text-text-muted">
				<span class="font-semibold text-accent">Assistant</span>
				{#if turn.metadata?.model}
					<span>&middot;</span>
					<span class="font-mono">{turn.metadata.model}</span>
				{/if}
				{#if turn.timestamp}
					<span>&middot;</span>
					<span class="font-mono">{new Date(turn.timestamp).toLocaleTimeString()}</span>
				{/if}
				{#if turn.metadata?.usage}
					<span>&middot;</span>
					<span class="font-mono">
						{turn.metadata.usage.input_tokens.toLocaleString()} in / {turn.metadata.usage.output_tokens.toLocaleString()}
						out
					</span>
				{/if}
			</div>

			<div class="space-y-4">
				{#each turn.content as block, i (i)}
					{#if block.type === 'text'}
						<div class="prose text-sm text-text" use:highlightProse use:highlightSearch={query}>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderMarkdown(block.text)}
						</div>
					{:else if block.type === 'tool_call'}
						<ToolCallBlock tool={block.tool} />
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>
