<script lang="ts">
	import { calculateThreadCost, formatCost, type ThreadData } from '@threadcast/shared';
	import { setThreadVisibility } from '$lib/remote-functions/threads.remote';
	import { timeAgo } from '$lib/utils/date';
	import { SvelteSet } from 'svelte/reactivity';

	let {
		thread,
		threadId,
		isOwner = false
	}: { thread: ThreadData; threadId: string; isOwner?: boolean } = $props();

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

	const formatModel = (model: string): string => {
		const match = model.match(/claude-(opus|sonnet|haiku)-(\d+)-(\d+)/i);
		if (match) {
			const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
			return `${name} ${match[2]}.${match[3]}`;
		}
		const lower = model.toLowerCase();
		if (lower.includes('opus')) return 'Opus';
		if (lower.includes('sonnet')) return 'Sonnet';
		if (lower.includes('haiku')) return 'Haiku';
		return model;
	};

	const stats = $derived.by(() => {
		const files = new SvelteSet<string>();
		let linesAdded = 0;
		let linesRemoved = 0;
		let promptCount = 0;

		for (const turn of thread.turns) {
			if (turn.role === 'user') promptCount++;

			for (const block of turn.content) {
				if (block.type !== 'tool_call') continue;
				const { name, input } = block.tool;

				if ((name === 'Edit' || name === 'Write' || name === 'Read') && input.file_path) {
					files.add(input.file_path as string);
				}

				if (name === 'Edit') {
					const oldLines = ((input.old_string as string) ?? '').split('\n').length;
					const newLines = ((input.new_string as string) ?? '').split('\n').length;
					linesAdded += newLines;
					linesRemoved += oldLines;
				}

				if (name === 'Write') {
					const content = (input.content as string) ?? '';
					linesAdded += content.split('\n').length;
				}
			}
		}

		return { files: files.size, linesAdded, linesRemoved, promptCount };
	});

	const totalTokens = $derived(
		(thread.metadata.totalTokens.input + thread.metadata.totalTokens.output).toLocaleString()
	);

	const estimatedCost = $derived(formatCost(calculateThreadCost(thread.turns)));
	const sourceLabel = $derived(thread.metadata.source === 'codex' ? 'Codex' : 'Claude Code');

	const primaryModel = $derived(
		thread.metadata.models.length > 0 ? formatModel(thread.metadata.models[0]) : 'Unknown'
	);

	let toggling = $state(false);
	let visibilityOverride: 'public' | 'private' | null = $state(null);
	const visibility = $derived(visibilityOverride ?? thread.metadata.visibility);

	const toggleVisibility = async () => {
		if (toggling) return;
		toggling = true;
		const previousVisibility = visibility;
		const newVisibility = visibility === 'public' ? 'private' : 'public';
		visibilityOverride = newVisibility;
		try {
			const result = await setThreadVisibility({ id: threadId, visibility: newVisibility });
			visibilityOverride = result.visibility;
		} catch {
			visibilityOverride = previousVisibility;
		} finally {
			toggling = false;
		}
	};

	let copied = $state(false);

	const copySessionId = async () => {
		await navigator.clipboard.writeText(thread.metadata.sessionId);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	};
</script>

<aside class="sticky top-8 hidden w-72 shrink-0 lg:block">
	<div class="space-y-6">
		<!-- Visibility -->
		{#if isOwner}
			<button
				onclick={toggleVisibility}
				disabled={toggling}
				class="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-border-light disabled:opacity-50"
			>
				<div class="flex items-center gap-2">
					{#if visibility === 'public'}
						<svg
							class="h-4 w-4 text-emerald-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path
								d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
							/>
						</svg>
						<span class="text-sm text-text">Public</span>
					{:else}
						<svg
							class="h-4 w-4 text-amber-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						<span class="text-sm text-text">Private</span>
					{/if}
				</div>
				<!-- Toggle switch -->
				<div
					class="relative h-5 w-9 rounded-full transition-colors {visibility === 'public'
						? 'bg-emerald-500'
						: 'bg-surface-3'}"
				>
					<div
						class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {visibility ===
						'public'
							? 'translate-x-4'
							: 'translate-x-0.5'}"
					></div>
				</div>
			</button>
		{:else}
			<div>
				{#if visibility === 'public'}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400"
					>
						<svg
							class="h-3 w-3"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path
								d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
							/>
						</svg>
						Public
					</span>
				{:else}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400"
					>
						<svg
							class="h-3 w-3"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						Private
					</span>
				{/if}
			</div>
		{/if}

		<!-- Thread metadata -->
		<div>
			<h3 class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Thread</h3>
			<div class="space-y-3">
				<!-- Source -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="4" y="4" width="16" height="16" rx="2" />
						<path d="M8 9h8M8 15h8M8 12h4" />
					</svg>
					<span class="text-text-secondary">{sourceLabel}</span>
				</div>

				<!-- Date -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					<span class="text-text-secondary">{timeAgo(thread.metadata.created)}</span>
				</div>

				<!-- Project -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
					</svg>
					<span class="text-text-secondary">{thread.metadata.projectName}</span>
				</div>

				<!-- Branch -->
				{#if thread.metadata.gitBranch}
					<div class="flex items-center gap-2.5 text-sm">
						<svg
							class="h-4 w-4 shrink-0 text-text-muted"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="6" y1="3" x2="6" y2="15" />
							<circle cx="18" cy="6" r="3" />
							<circle cx="6" cy="18" r="3" />
							<path d="M18 9a9 9 0 0 1-9 9" />
						</svg>
						<code class="truncate rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text-secondary"
							>{thread.metadata.gitBranch}</code
						>
					</div>
				{/if}

				<!-- Model -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5" />
						<path d="M2 12l10 5 10-5" />
					</svg>
					<span class="text-text-secondary">{primaryModel}</span>
				</div>

				<!-- Prompts -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<span class="text-text-secondary">{stats.promptCount} prompts</span>
				</div>

				<!-- Tokens -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 6v6l4 2" />
					</svg>
					<span class="text-text-secondary">{totalTokens} tokens</span>
				</div>

				<!-- Cost -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="1" x2="12" y2="23" />
						<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
					</svg>
					<span class="text-text-secondary">{estimatedCost} est.</span>
				</div>

				<!-- Files -->
				{#if stats.files > 0}
					<div class="flex items-center gap-2.5 text-sm">
						<svg
							class="h-4 w-4 shrink-0 text-text-muted"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
						<span class="text-text-secondary">{stats.files} files</span>
					</div>
				{/if}

				<!-- Lines -->
				{#if stats.linesAdded > 0 || stats.linesRemoved > 0}
					<div class="flex items-center gap-2.5 text-sm">
						<svg
							class="h-4 w-4 shrink-0 text-text-muted"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="16 18 22 12 16 6" />
							<polyline points="8 6 2 12 8 18" />
						</svg>
						<span>
							<span class="text-emerald-400">+{stats.linesAdded}</span>
							<span class="text-red-400 ml-1">-{stats.linesRemoved}</span>
							<span class="text-text-muted"> lines</span>
						</span>
					</div>
				{/if}

				<!-- Duration -->
				<div class="flex items-center gap-2.5 text-sm">
					<svg
						class="h-4 w-4 shrink-0 text-text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<span class="text-text-secondary">{thread.metadata.duration}</span>
				</div>
			</div>
		</div>

		<!-- Tools Used -->
		{#if thread.metadata.toolsUsed.length > 0}
			<div>
				<h3 class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Tools Used</h3>
				<div class="flex flex-wrap gap-1.5">
					{#each thread.metadata.toolsUsed as tool (tool)}
						<span
							class="rounded-full px-2.5 py-0.5 text-xs {TOOL_COLORS[tool] ||
								'bg-surface-2 text-text-muted'}"
						>
							{tool}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Reference Thread -->
		<div>
			<h3 class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">
				Reference Thread
			</h3>
			<div class="flex items-center gap-2">
				<code
					class="min-w-0 flex-1 truncate rounded bg-surface-2 px-2 py-1 text-xs text-text-muted"
				>
					{thread.metadata.sessionId}
				</code>
				<button
					onclick={copySessionId}
					class="cursor-pointer shrink-0 rounded p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
					aria-label="Copy session ID"
				>
					{#if copied}
						<svg
							class="h-4 w-4 text-emerald-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
</aside>
