<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';

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
	<div class="flex items-center gap-2 text-xs">
		<span class="text-text-muted">Read</span>
		<code class="rounded bg-bg-tertiary px-1.5 py-0.5 text-accent">{filePath}</code>
		{#if rangeLabel}
			<span class="text-text-muted">{rangeLabel}</span>
		{/if}
	</div>

	{#if tool.result}
		<pre
			class="max-h-96 overflow-auto rounded bg-bg-secondary p-3 font-mono text-xs"
			class:text-error={tool.result.isError}
			class:text-text-secondary={!tool.result.isError}>{tool.result.content}</pre>
	{/if}
</div>
