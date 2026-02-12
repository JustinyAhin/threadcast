<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';

	let { tool }: { tool: ToolCall } = $props();

	const pattern = $derived((tool.input.pattern as string) || '');
	const path = $derived((tool.input.path as string) || '');
	const toolLabel = $derived(tool.name === 'Grep' ? 'grep' : 'glob');
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-xs">
		<span class="text-text-muted">{toolLabel}</span>
		<code class="rounded bg-bg-tertiary px-1.5 py-0.5 text-accent">{pattern}</code>
		{#if path}
			<span class="text-text-muted">in</span>
			<code class="rounded bg-bg-tertiary px-1.5 py-0.5 text-text-secondary">{path}</code>
		{/if}
	</div>

	{#if tool.result}
		<pre
			class="max-h-64 overflow-auto rounded bg-bg-secondary p-3 font-mono text-xs"
			class:text-error={tool.result.isError}
			class:text-text-secondary={!tool.result.isError}>{tool.result.content || '(no results)'}</pre>
	{/if}
</div>
