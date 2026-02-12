<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';

	let { tool }: { tool: ToolCall } = $props();

	const filePath = $derived((tool.input.file_path as string) || 'unknown');
	const oldString = $derived((tool.input.old_string as string) || '');
	const newString = $derived((tool.input.new_string as string) || '');
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-xs">
		<span class="text-text-muted">Edit</span>
		<code class="rounded bg-bg-tertiary px-1.5 py-0.5 text-accent">{filePath}</code>
	</div>

	<div class="grid gap-2 md:grid-cols-2">
		<div class="rounded border border-red-500/20 bg-bg-secondary">
			<div class="border-b border-red-500/20 px-3 py-1 text-xs text-red-400">Removed</div>
			<pre class="max-h-64 overflow-auto p-3 font-mono text-xs text-red-300/80">{oldString ||
					'(empty)'}</pre>
		</div>
		<div class="rounded border border-green-500/20 bg-bg-secondary">
			<div class="border-b border-green-500/20 px-3 py-1 text-xs text-green-400">Added</div>
			<pre class="max-h-64 overflow-auto p-3 font-mono text-xs text-green-300/80">{newString ||
					'(empty)'}</pre>
		</div>
	</div>

	{#if tool.result?.isError}
		<pre class="rounded bg-bg-secondary p-2 font-mono text-xs text-error">{tool.result
				.content}</pre>
	{/if}
</div>
