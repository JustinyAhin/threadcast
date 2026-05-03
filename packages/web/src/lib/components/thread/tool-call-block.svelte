<script lang="ts">
	import type { ThreadToolCall } from '$lib/types/thread-view';
	import { getThreadToolPayload } from '$lib/remote-functions/threads.remote';
	import CodeBlock from '$lib/components/code-block.svelte';
	import BashBlock from './bash-block.svelte';
	import FileReadBlock from './file-read-block.svelte';
	import EditBlock from './edit-block.svelte';
	import SearchBlock from './search-block.svelte';

	let { tool, threadId }: { tool: ThreadToolCall; threadId: string } = $props();
	let expanded = $state(false);
	let loadedTool = $state<ThreadToolCall | null>(null);
	let loadingPayload = $state(false);
	let payloadError = $state(false);

	const TOOL_ICONS: Record<string, { symbol: string; color: string }> = {
		Bash: { symbol: '$', color: 'text-emerald-400' },
		Read: { symbol: '>', color: 'text-sky-400' },
		Edit: { symbol: '~', color: 'text-amber-400' },
		Write: { symbol: '+', color: 'text-orange-400' },
		Grep: { symbol: '?', color: 'text-violet-400' },
		Glob: { symbol: '*', color: 'text-teal-400' },
		WebFetch: { symbol: '@', color: 'text-cyan-400' },
		WebSearch: { symbol: '@', color: 'text-cyan-400' },
		Task: { symbol: '#', color: 'text-rose-400' }
	};

	const getSummary = (t: ThreadToolCall): string => {
		switch (t.name) {
			case 'Bash':
				return t.input.command ? truncate(t.input.command as string, 80) : 'Run command';
			case 'Read':
				return t.input.file_path ? shortPath(t.input.file_path as string) : 'Read file';
			case 'Edit':
				return t.input.file_path ? `Edit ${shortPath(t.input.file_path as string)}` : 'Edit file';
			case 'Write':
				return t.input.file_path ? `Write ${shortPath(t.input.file_path as string)}` : 'Write file';
			case 'Grep':
				return t.input.pattern ? `grep "${truncate(t.input.pattern as string, 40)}"` : 'Search';
			case 'Glob':
				return t.input.pattern ? `glob "${truncate(t.input.pattern as string, 40)}"` : 'Find files';
			default:
				return t.name;
		}
	};

	const shortPath = (p: string): string => {
		const parts = p.split('/');
		return parts.length > 3 ? `.../${parts.slice(-2).join('/')}` : p;
	};

	const truncate = (s: string, max: number): string => {
		const firstLine = s.split('\n')[0];
		return firstLine.length > max ? firstLine.slice(0, max) + '...' : firstLine;
	};

	const visibleTool = $derived(loadedTool ?? tool);
	const iconInfo = $derived(
		TOOL_ICONS[visibleTool.name] || { symbol: '>', color: 'text-text-muted' }
	);
	const summary = $derived(getSummary(visibleTool));
	const hasError = $derived(visibleTool.result?.isError ?? false);
	const needsPayload = $derived(Boolean(tool.hasDeferredPayload && !loadedTool));

	const loadPayload = async () => {
		if (!needsPayload || loadingPayload) return;
		loadingPayload = true;
		payloadError = false;

		try {
			const result = await getThreadToolPayload({ threadId, toolId: tool.id });
			loadedTool = result.tool;
		} catch {
			payloadError = true;
		} finally {
			loadingPayload = false;
		}
	};

	const toggleExpanded = () => {
		expanded = !expanded;
		if (expanded) {
			void loadPayload();
		}
	};
</script>

<div class="rounded-md border border-tool-border bg-tool-bg">
	<button
		class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2/50"
		onclick={toggleExpanded}
	>
		<span class="shrink-0 font-mono text-xs {iconInfo.color}">{iconInfo.symbol}</span>
		<span class="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{summary}</span>
		{#if hasError}
			<span class="shrink-0 rounded-full bg-error/10 px-2 py-0.5 text-xs text-error">error</span>
		{/if}
		<span class="shrink-0 text-xs text-text-muted transition-transform" class:rotate-90={expanded}
			>&#9654;</span
		>
	</button>

	{#if expanded}
		<div class="animate-expand border-t border-tool-border p-3">
			{#if loadingPayload}
				<div class="rounded bg-surface-1 p-3 font-mono text-xs text-text-muted">
					Loading tool payload...
				</div>
			{:else if payloadError}
				<button
					class="cursor-pointer rounded bg-surface-1 px-3 py-2 font-mono text-xs text-text-muted transition-colors hover:text-text"
					onclick={loadPayload}
				>
					Retry loading tool payload
				</button>
			{:else if visibleTool.name === 'Bash'}
				<BashBlock tool={visibleTool} />
			{:else if visibleTool.name === 'Read'}
				<FileReadBlock tool={visibleTool} />
			{:else if visibleTool.name === 'Edit'}
				<EditBlock tool={visibleTool} />
			{:else if visibleTool.name === 'Grep' || visibleTool.name === 'Glob'}
				<SearchBlock tool={visibleTool} />
			{:else}
				<!-- Generic tool display -->
				<div class="space-y-2">
					<div class="text-xs text-text-muted">Input</div>
					<CodeBlock code={JSON.stringify(visibleTool.input, null, 2)} lang="json" />
					{#if visibleTool.result}
						<div class="text-xs text-text-muted">Output</div>
						{#if visibleTool.result.isError}
							<pre
								class="max-h-96 overflow-auto rounded bg-surface-1 p-2 font-mono text-xs text-error">{visibleTool
									.result.content}</pre>
						{:else}
							<CodeBlock code={visibleTool.result.content} lang="json" maxHeight="24rem" />
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
