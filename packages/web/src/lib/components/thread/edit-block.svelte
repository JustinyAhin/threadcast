<script lang="ts">
	import type { ThreadToolCall } from '$lib/types/thread-view';
	import DiffView from '$lib/components/diff-view.svelte';

	let { tool }: { tool: ThreadToolCall } = $props();

	const filePath = $derived((tool.input.file_path as string) || 'unknown');
	const oldString = $derived((tool.input.old_string as string) || '');
	const newString = $derived((tool.input.new_string as string) || '');
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2">
		<span class="text-text-muted">Edit</span>
		<code class="min-w-0 break-all rounded bg-surface-2 px-1.5 py-0.5 text-accent">{filePath}</code>
	</div>

	<DiffView oldCode={oldString} newCode={newString} fileName={filePath} />

	{#if tool.result?.isError}
		<pre class="rounded bg-surface-1 p-2 font-mono text-xs text-error">{tool.result.content}</pre>
	{/if}
</div>
