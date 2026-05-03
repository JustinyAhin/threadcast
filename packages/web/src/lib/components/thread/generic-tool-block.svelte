<script lang="ts">
	import type { ThreadToolCall } from '$lib/types/thread-view';
	import CodeBlock from '$lib/components/code-block.svelte';

	let { tool }: { tool: ThreadToolCall } = $props();
</script>

<div class="space-y-2">
	<div class="text-xs text-text-muted">Input</div>
	<CodeBlock code={JSON.stringify(tool.input, null, 2)} lang="json" />
	{#if tool.result}
		<div class="text-xs text-text-muted">Output</div>
		{#if tool.result.isError}
			<pre
				class="max-h-96 overflow-auto rounded bg-surface-1 p-2 font-mono text-xs text-error">{tool
					.result.content}</pre>
		{:else}
			<CodeBlock code={tool.result.content} lang="json" maxHeight="24rem" />
		{/if}
	{/if}
</div>
