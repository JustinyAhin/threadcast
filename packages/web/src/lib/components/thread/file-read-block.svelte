<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';
	import CodeBlock from '$lib/components/code-block.svelte';
	import { guessLang } from '$lib/highlighter';

	let { tool }: { tool: ToolCall } = $props();

	const filePath = $derived((tool.input.file_path as string) || 'unknown');
	const offset = $derived(tool.input.offset as number | undefined);
	const limit = $derived(tool.input.limit as number | undefined);

	const rangeLabel = $derived(
		offset || limit
			? ` (${offset ? `from line ${offset}` : ''}${offset && limit ? ', ' : ''}${limit ? `${limit} lines` : ''})`
			: ''
	);
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2">
		<span class="text-text-muted">Read</span>
		<code class="min-w-0 break-all rounded bg-surface-2 px-1.5 py-0.5 text-accent">{filePath}</code>
		{#if rangeLabel}
			<span class="text-text-muted">{rangeLabel}</span>
		{/if}
	</div>

	{#if tool.result}
		{#if tool.result.isError}
			<pre
				class="max-h-96 overflow-auto rounded bg-surface-1 p-3 font-mono text-xs text-error">{tool
					.result.content}</pre>
		{:else}
			<CodeBlock code={tool.result.content} lang={guessLang(filePath)} maxHeight="24rem" />
		{/if}
	{/if}
</div>
