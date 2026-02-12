<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';

	let { tool }: { tool: ToolCall } = $props();

	const command = $derived((tool.input.command as string) || '');
	const description = $derived((tool.input.description as string) || '');
</script>

<div class="space-y-2">
	{#if description}
		<div class="text-xs text-text-muted">{description}</div>
	{/if}

	<div class="rounded bg-bg-secondary">
		<div class="flex items-center gap-2 border-b border-border px-3 py-1.5">
			<span class="text-xs text-text-muted">$</span>
			<pre class="flex-1 overflow-x-auto font-mono text-xs text-text">{command}</pre>
		</div>

		{#if tool.result}
			<pre
				class="max-h-96 overflow-auto p-3 font-mono text-xs"
				class:text-error={tool.result.isError}
				class:text-text-secondary={!tool.result.isError}>{tool.result.content || '(no output)'}</pre>
		{/if}
	</div>
</div>
