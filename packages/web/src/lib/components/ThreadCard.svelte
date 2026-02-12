<script lang="ts">
	import type { ThreadMeta } from '$lib/server/r2';

	let { thread }: { thread: ThreadMeta } = $props();

	function timeAgo(dateStr: string): string {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return new Date(dateStr).toLocaleDateString();
	}
</script>

<a
	href="/threads/{thread.id}"
	class="block rounded-lg border border-border bg-bg-secondary p-5 transition-colors hover:border-border-light"
>
	<div class="mb-2 flex items-start justify-between gap-3">
		<h3 class="line-clamp-2 font-medium text-text">{thread.metadata.title}</h3>
		<span class="shrink-0 text-xs text-text-muted">{timeAgo(thread.metadata.created)}</span>
	</div>

	<div class="mb-3 flex items-center gap-2 text-sm text-text-secondary">
		<img
			src={thread.uploader.githubAvatarUrl}
			alt={thread.uploader.githubUsername}
			class="h-5 w-5 rounded-full"
		/>
		<span>{thread.uploader.githubUsername}</span>
		{#if thread.metadata.projectName}
			<span class="text-text-muted">&middot;</span>
			<span class="text-text-muted">{thread.metadata.projectName}</span>
		{/if}
	</div>

	<div class="flex flex-wrap gap-3 text-xs text-text-muted">
		<span>{thread.metadata.messageCount} messages</span>
		<span>&middot;</span>
		<span>{thread.metadata.duration}</span>
		{#if thread.metadata.toolsUsed.length > 0}
			<span>&middot;</span>
			<span>{thread.metadata.toolsUsed.slice(0, 4).join(', ')}</span>
		{/if}
	</div>
</a>
