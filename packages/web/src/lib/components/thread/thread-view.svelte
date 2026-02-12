<script lang="ts">
	import type { ThreadData } from '@threadcast/shared';
	import UserMessage from './user-message.svelte';
	import AssistantMessage from './assistant-message.svelte';

	let { thread }: { thread: ThreadData } = $props();

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
</script>

<div class="mx-auto max-w-4xl">
	<!-- Thread header -->
	<div class="mb-8 border-b border-border pb-6">
		<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Session</p>
		<h1 class="mb-3 text-2xl font-bold text-text">{thread.metadata.title}</h1>
		<div class="mb-4 flex items-center gap-3">
			<img
				src={thread.uploader.githubAvatarUrl}
				alt={thread.uploader.githubUsername}
				class="h-8 w-8 rounded-full ring-1 ring-border"
			/>
			<div>
				<a
					href="/u/{thread.uploader.githubUsername}"
					class="font-medium text-text hover:text-accent"
				>
					{thread.uploader.githubUsername}
				</a>
				<div class="font-mono text-xs text-text-muted">
					{new Date(thread.metadata.created).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 rounded-lg border border-border p-4 sm:grid-cols-4">
			<div>
				<div class="mb-1 font-mono text-xs text-text-muted">Project</div>
				<div class="text-sm text-text-secondary">{thread.metadata.projectName}</div>
			</div>
			{#if thread.metadata.gitBranch}
				<div>
					<div class="mb-1 font-mono text-xs text-text-muted">Branch</div>
					<code class="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text-secondary"
						>{thread.metadata.gitBranch}</code
					>
				</div>
			{/if}
			<div>
				<div class="mb-1 font-mono text-xs text-text-muted">Duration</div>
				<div class="text-sm text-text-secondary">{thread.metadata.duration}</div>
			</div>
			<div>
				<div class="mb-1 font-mono text-xs text-text-muted">Messages</div>
				<div class="text-sm text-text-secondary">{thread.metadata.messageCount}</div>
			</div>
			<div>
				<div class="mb-1 font-mono text-xs text-text-muted">Tokens</div>
				<div class="text-sm text-text-secondary">
					{(
						thread.metadata.totalTokens.input + thread.metadata.totalTokens.output
					).toLocaleString()}
				</div>
			</div>
		</div>

		{#if thread.metadata.toolsUsed.length > 0}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each thread.metadata.toolsUsed as tool (tool)}
					<span
						class="rounded-full px-2.5 py-0.5 text-xs {TOOL_COLORS[tool] ||
							'bg-surface-2 text-text-muted'}"
					>
						{tool}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Conversation turns -->
	<div class="space-y-8">
		{#each thread.turns as turn, i (i)}
			<div class="animate-slide-up" style="--delay: {Math.min(i * 40, 600)}ms">
				{#if turn.role === 'user'}
					<UserMessage {turn} />
				{:else}
					<AssistantMessage {turn} />
				{/if}
			</div>
		{/each}
	</div>
</div>
