<script lang="ts">
	import type { ThreadMeta } from '$lib/server/r2';
	import { timeAgo } from '$lib/utils/date';
	import { highlightText } from '$lib/utils/highlight-text';

	let { thread, query = '' }: { thread: ThreadMeta; query?: string } = $props();

	const TOOL_COLORS: Record<string, string> = {
		Bash: 'bg-emerald-500/15 text-emerald-400',
		Read: 'bg-sky-500/15 text-sky-400',
		Edit: 'bg-amber-500/15 text-amber-400',
		Write: 'bg-orange-500/15 text-orange-400',
		Grep: 'bg-violet-500/15 text-violet-400',
		Glob: 'bg-teal-500/15 text-teal-400',
		WebFetch: 'bg-cyan-500/15 text-cyan-400',
		WebSearch: 'bg-cyan-500/15 text-cyan-400',
		Task: 'bg-rose-500/15 text-rose-400'
	};

	const sourceLabel = $derived(thread.metadata.source === 'codex' ? 'Codex' : 'Claude Code');
</script>

<a
	href="/threads/{thread.id}"
	class="hover-glow group block rounded-lg border border-border bg-surface-1 p-5"
>
	<div class="mb-3 flex items-start justify-between gap-3">
		<h3 class="line-clamp-2 font-medium text-text transition-colors group-hover:text-accent">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html highlightText(thread.metadata.title, query)}
		</h3>
		<div class="flex shrink-0 flex-col items-end gap-1">
			<span
				class="rounded-full px-2 py-0.5 font-mono text-[11px] {thread.metadata.source === 'codex'
					? 'bg-sky-500/15 text-sky-400'
					: 'bg-amber-500/15 text-amber-400'}"
			>
				{sourceLabel}
			</span>
			<span class="font-mono text-xs text-text-muted">{timeAgo(thread.metadata.created)}</span>
		</div>
	</div>

	<div class="mb-3 flex items-center gap-2 text-sm text-text-secondary">
		<img
			src={thread.uploader.githubAvatarUrl}
			alt={thread.uploader.githubUsername}
			class="h-5 w-5 rounded-full ring-1 ring-border"
		/>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<span>{@html highlightText(thread.uploader.githubUsername, query)}</span>
		{#if thread.metadata.projectName}
			<span class="text-text-muted">in</span>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<span class="text-text-muted">{@html highlightText(thread.metadata.projectName, query)}</span>
		{/if}
	</div>

	{#if thread.metadata.toolsUsed.length > 0}
		<div class="mb-3 flex flex-wrap gap-1.5">
			{#each thread.metadata.toolsUsed.slice(0, 4) as tool (tool)}
				<span
					class="rounded-full px-2 py-0.5 text-xs {TOOL_COLORS[tool] ||
						'bg-surface-2 text-text-muted'}"
				>
					{tool}
				</span>
			{/each}
		</div>
	{/if}

	<div class="flex items-center justify-between text-xs text-text-muted">
		<span class="font-mono">{thread.metadata.messageCount} messages</span>
		<span class="font-mono">{thread.metadata.duration}</span>
	</div>
</a>
