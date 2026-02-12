<script lang="ts">
	import type { ThreadData } from '@threadcast/shared';
	import UserMessage from './user-message.svelte';
	import AssistantMessage from './assistant-message.svelte';

	let { thread }: { thread: ThreadData } = $props();
</script>

<div class="mx-auto max-w-4xl">
	<!-- Thread header -->
	<div class="mb-8 border-b border-border pb-6">
		<h1 class="mb-3 text-2xl font-bold text-text">{thread.metadata.title}</h1>
		<div class="mb-4 flex items-center gap-3">
			<img
				src={thread.uploader.githubAvatarUrl}
				alt={thread.uploader.githubUsername}
				class="h-8 w-8 rounded-full"
			/>
			<div>
				<a
					href="/u/{thread.uploader.githubUsername}"
					class="font-medium text-text hover:text-accent"
				>
					{thread.uploader.githubUsername}
				</a>
				<div class="text-xs text-text-muted">
					{new Date(thread.metadata.created).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</div>
			</div>
		</div>

		<div class="flex flex-wrap gap-4 text-sm text-text-secondary">
			<div>
				<span class="text-text-muted">Project:</span>
				{thread.metadata.projectName}
			</div>
			{#if thread.metadata.gitBranch}
				<div>
					<span class="text-text-muted">Branch:</span>
					<code class="rounded bg-bg-tertiary px-1.5 py-0.5 text-xs"
						>{thread.metadata.gitBranch}</code
					>
				</div>
			{/if}
			<div>
				<span class="text-text-muted">Duration:</span>
				{thread.metadata.duration}
			</div>
			<div>
				<span class="text-text-muted">Messages:</span>
				{thread.metadata.messageCount}
			</div>
			<div>
				<span class="text-text-muted">Tokens:</span>
				{(thread.metadata.totalTokens.input + thread.metadata.totalTokens.output).toLocaleString()}
			</div>
		</div>

		{#if thread.metadata.toolsUsed.length > 0}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each thread.metadata.toolsUsed as tool (tool)}
					<span class="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs text-text-muted">
						{tool}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Conversation turns -->
	<div class="space-y-6">
		{#each thread.turns as turn, i (i)}
			{#if turn.role === 'user'}
				<UserMessage {turn} />
			{:else}
				<AssistantMessage {turn} />
			{/if}
		{/each}
	</div>
</div>
