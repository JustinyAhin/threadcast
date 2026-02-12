<script lang="ts">
	import type { ToolCall } from '@threadcast/shared';
	import BashBlock from './bash-block.svelte';
	import FileReadBlock from './file-read-block.svelte';
	import EditBlock from './edit-block.svelte';
	import SearchBlock from './search-block.svelte';

	let { tool }: { tool: ToolCall } = $props();
	let expanded = $state(false);

	const TOOL_ICONS: Record<string, string> = {
		Bash: '$ ',
		Read: '\u{1F4C4} ',
		Edit: '\u{270F}\u{FE0F} ',
		Write: '\u{1F4DD} ',
		Grep: '\u{1F50D} ',
		Glob: '\u{1F4C2} ',
		WebFetch: '\u{1F310} ',
		WebSearch: '\u{1F310} ',
		Task: '\u{1F4CB} '
	};

	function getSummary(t: ToolCall): string {
		switch (t.name) {
			case 'Bash':
				return t.input.command
					? truncate(t.input.command as string, 80)
					: 'Run command';
			case 'Read':
				return t.input.file_path ? shortPath(t.input.file_path as string) : 'Read file';
			case 'Edit':
				return t.input.file_path ? `Edit ${shortPath(t.input.file_path as string)}` : 'Edit file';
			case 'Write':
				return t.input.file_path
					? `Write ${shortPath(t.input.file_path as string)}`
					: 'Write file';
			case 'Grep':
				return t.input.pattern ? `grep "${truncate(t.input.pattern as string, 40)}"` : 'Search';
			case 'Glob':
				return t.input.pattern ? `glob "${truncate(t.input.pattern as string, 40)}"` : 'Find files';
			default:
				return t.name;
		}
	}

	function shortPath(p: string): string {
		const parts = p.split('/');
		return parts.length > 3 ? `.../${parts.slice(-2).join('/')}` : p;
	}

	function truncate(s: string, max: number): string {
		const firstLine = s.split('\n')[0];
		return firstLine.length > max ? firstLine.slice(0, max) + '...' : firstLine;
	}

	const icon = $derived(TOOL_ICONS[tool.name] || '\u{1F527} ');
	const summary = $derived(getSummary(tool));
	const hasError = $derived(tool.result?.isError ?? false);
</script>

<div class="rounded-md border border-tool-border bg-tool-bg">
	<button
		class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary"
		onclick={() => (expanded = !expanded)}
	>
		<span class="shrink-0 font-mono text-xs">{icon}</span>
		<span class="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{summary}</span>
		{#if hasError}
			<span class="shrink-0 text-xs text-error">error</span>
		{/if}
		<span class="shrink-0 text-xs text-text-muted transition-transform" class:rotate-90={expanded}
			>&#9654;</span
		>
	</button>

	{#if expanded}
		<div class="border-t border-tool-border p-3">
			{#if tool.name === 'Bash'}
				<BashBlock {tool} />
			{:else if tool.name === 'Read'}
				<FileReadBlock {tool} />
			{:else if tool.name === 'Edit'}
				<EditBlock {tool} />
			{:else if tool.name === 'Grep' || tool.name === 'Glob'}
				<SearchBlock {tool} />
			{:else}
				<!-- Generic tool display -->
				<div class="space-y-2">
					<div class="text-xs text-text-muted">Input</div>
					<pre
						class="overflow-x-auto rounded bg-bg-secondary p-2 font-mono text-xs text-text-secondary">{JSON.stringify(tool.input, null, 2)}</pre>
					{#if tool.result}
						<div class="text-xs text-text-muted">Output</div>
						<pre
							class="max-h-96 overflow-auto rounded bg-bg-secondary p-2 font-mono text-xs"
							class:text-error={tool.result.isError}
							class:text-text-secondary={!tool.result.isError}>{tool.result.content}</pre>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
