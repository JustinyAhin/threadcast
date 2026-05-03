<script lang="ts">
	import type { ThreadToolCall } from '$lib/types/thread-view';
	import CodeBlock from '$lib/components/code-block.svelte';

	let { tool }: { tool: ThreadToolCall } = $props();

	const command = $derived((tool.input.command as string) || '');
	const description = $derived((tool.input.description as string) || '');
</script>

<div class="space-y-2">
	{#if description}
		<div class="text-xs text-text-muted">{description}</div>
	{/if}

	<div class="rounded bg-surface-1">
		<div class="flex items-center gap-2 border-b border-border px-3 py-1.5">
			<span class="text-xs text-text-muted">$</span>
			<CodeBlock code={command} lang="bash" />
		</div>

		{#if tool.result}
			{#if tool.result.isError}
				<pre class="max-h-96 overflow-auto p-3 font-mono text-xs text-error">{tool.result.content ||
						'(no output)'}</pre>
			{:else}
				<CodeBlock code={tool.result.content || '(no output)'} lang="bash" maxHeight="24rem" />
			{/if}
		{/if}
	</div>
</div>
