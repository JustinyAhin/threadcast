<script lang="ts">
	import type { ProcessedTurn } from '@threadcast/shared';
	import { renderMarkdown } from '$lib/markdown';
	import ToolCallBlock from './tool-call-block.svelte';

	let { turn }: { turn: ProcessedTurn } = $props();
</script>

<div class="rounded-lg bg-assistant-bg p-5">
	<div class="mb-3 flex items-center gap-2 text-xs text-text-muted">
		<span class="font-semibold text-accent">Assistant</span>
		{#if turn.metadata?.model}
			<span>&middot;</span>
			<span>{turn.metadata.model}</span>
		{/if}
		{#if turn.timestamp}
			<span>&middot;</span>
			<span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
		{/if}
		{#if turn.metadata?.usage}
			<span>&middot;</span>
			<span>
				{turn.metadata.usage.input_tokens.toLocaleString()} in / {turn.metadata.usage.output_tokens.toLocaleString()}
				out
			</span>
		{/if}
	</div>

	<div class="space-y-4">
		{#each turn.content as block, i (i)}
			{#if block.type === 'text'}
				<div class="prose text-sm text-text">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html renderMarkdown(block.text)}
				</div>
			{:else if block.type === 'tool_call'}
				<ToolCallBlock tool={block.tool} />
			{/if}
		{/each}
	</div>
</div>
