<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';
	import CodeBlock from '$lib/components/code-block.svelte';

	let { tool }: { tool: ToolCall } = $props();

	const pattern = $derived((tool.input.pattern as string) || '');
	const path = $derived((tool.input.path as string) || '');
	const toolLabel = $derived(tool.name === 'Grep' ? 'grep' : 'glob');
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2">
		<span class="text-text-muted">{toolLabel}</span>
		<code class="min-w-0 break-all rounded bg-surface-2 px-1.5 py-0.5 text-accent">{pattern}</code>
		{#if path}
			<span class="text-text-muted">in</span>
			<code class="min-w-0 break-all rounded bg-surface-2 px-1.5 py-0.5 text-text-secondary"
				>{path}</code
			>
		{/if}
	</div>

	{#if tool.result}
		{#if tool.result.isError}
			<pre
				class="max-h-64 overflow-auto rounded bg-surface-1 p-3 font-mono text-xs text-error">{tool
					.result.content || '(no results)'}</pre>
		{:else}
			<CodeBlock code={tool.result.content || '(no results)'} maxHeight="16rem" />
		{/if}
	{/if}
</div>
