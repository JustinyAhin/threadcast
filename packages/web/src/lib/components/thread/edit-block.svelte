<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';
	import DiffView from '$lib/components/diff-view.svelte';

	let { tool }: { tool: ToolCall } = $props();

	const filePath = $derived((tool.input.file_path as string) || 'unknown');
	const oldString = $derived((tool.input.old_string as string) || '');
	const newString = $derived((tool.input.new_string as string) || '');
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-xs">
		<span class="text-text-muted">Edit</span>
		<code class="rounded bg-surface-2 px-1.5 py-0.5 text-accent">{filePath}</code>
	</div>

	<DiffView oldCode={oldString} newCode={newString} fileName={filePath} />

	{#if tool.result?.isError}
		<pre class="rounded bg-surface-1 p-2 font-mono text-xs text-error">{tool.result.content}</pre>
	{/if}
</div>
