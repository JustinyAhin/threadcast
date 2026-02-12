<script lang="ts">
	import type { ThreadMeta } from '$lib/server/r2';

	let { thread }: { thread: ThreadMeta } = $props();

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

	const timeAgo = (dateStr: string): string => {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return new Date(dateStr).toLocaleDateString();
	};
</script>

<a
	href="/threads/{thread.id}"
	class="hover-glow group block rounded-lg border border-border bg-surface-1 p-5"
>
	<div class="mb-3 flex items-start justify-between gap-3">
		<h3 class="line-clamp-2 font-medium text-text transition-colors group-hover:text-accent">
			{thread.metadata.title}
		</h3>
		<span class="shrink-0 font-mono text-xs text-text-muted"
			>{timeAgo(thread.metadata.created)}</span
		>
	</div>

	<div class="mb-3 flex items-center gap-2 text-sm text-text-secondary">
		<img
			src={thread.uploader.githubAvatarUrl}
			alt={thread.uploader.githubUsername}
			class="h-5 w-5 rounded-full ring-1 ring-border"
		/>
		<span>{thread.uploader.githubUsername}</span>
		{#if thread.metadata.projectName}
			<span class="text-text-muted">in</span>
			<span class="text-text-muted">{thread.metadata.projectName}</span>
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
