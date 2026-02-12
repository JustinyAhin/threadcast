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

	let query = $state('');
	let inputEl = $state<HTMLInputElement>();
	let activeTurnIndex = $state(-1);
	let turnEls = $state<(HTMLDivElement | null)[]>([]);

	const getTurnText = (turn: (typeof thread.turns)[number]): string => {
		return turn.content
			.map((block) => {
				if (block.type === 'text') return block.text;
				if (block.type === 'tool_call') {
					const parts = [block.tool.name, JSON.stringify(block.tool.input)];
					if (block.tool.result) parts.push(block.tool.result.content);
					return parts.join(' ');
				}
				return '';
			})
			.join(' ')
			.toLowerCase();
	};

	const matchingIndices = $derived.by(() => {
		const q = query.toLowerCase().trim();
		if (!q) return [];
		return thread.turns
			.map((turn, i) => (getTurnText(turn).includes(q) ? i : -1))
			.filter((i) => i !== -1);
	});

	const isSearching = $derived(query.trim().length > 0);

	const scrollToTurn = (index: number) => {
		const el = turnEls[index];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	const goToMatch = (direction: 'next' | 'prev') => {
		if (matchingIndices.length === 0) return;
		const currentPos = matchingIndices.indexOf(activeTurnIndex);
		let nextPos: number;
		if (direction === 'next') {
			nextPos = currentPos === -1 ? 0 : (currentPos + 1) % matchingIndices.length;
		} else {
			nextPos =
				currentPos === -1
					? matchingIndices.length - 1
					: (currentPos - 1 + matchingIndices.length) % matchingIndices.length;
		}
		activeTurnIndex = matchingIndices[nextPos];
		scrollToTurn(activeTurnIndex);
	};

	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === '/' && document.activeElement !== inputEl) {
			e.preventDefault();
			inputEl?.focus();
		}
		if (e.key === 'Escape' && document.activeElement === inputEl) {
			if (query) {
				query = '';
				activeTurnIndex = -1;
			} else {
				inputEl?.blur();
			}
		}
		if (e.key === 'Enter' && document.activeElement === inputEl) {
			e.preventDefault();
			goToMatch(e.shiftKey ? 'prev' : 'next');
		}
	};
</script>

<svelte:window onkeydown={onKeydown} />

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

	<!-- Search bar -->
	<div
		class="sticky top-0 z-10 -mx-4 mb-8 px-4 pb-4 pt-2 backdrop-blur-md"
		style="background: rgba(12, 10, 9, 0.85);"
	>
		<div class="relative flex items-center gap-2">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg
						class="h-3.5 w-3.5 text-text-muted"
						viewBox="0 0 20 20"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="8.5" cy="8.5" r="5.5" />
						<path d="M12.5 12.5L17 17" stroke-linecap="round" />
					</svg>
				</div>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Search in conversation..."
					class="w-full rounded-lg border border-border bg-surface-1 py-2 pr-10 pl-9 font-mono text-sm text-text placeholder-text-muted transition-colors focus:border-border-light focus:outline-none"
				/>
				{#if !isSearching}
					<div
						class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-xs text-text-muted"
					>
						/
					</div>
				{/if}
			</div>

			{#if isSearching}
				<div class="flex shrink-0 items-center gap-1.5">
					<span class="font-mono text-xs text-text-muted">
						{matchingIndices.length}
						{matchingIndices.length === 1 ? 'match' : 'matches'}
					</span>
					<button
						onclick={() => goToMatch('prev')}
						class="cursor-pointer rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
						aria-label="Previous match"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<button
						onclick={() => goToMatch('next')}
						class="cursor-pointer rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
						aria-label="Next match"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<button
						onclick={() => {
							query = '';
							activeTurnIndex = -1;
						}}
						class="cursor-pointer rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
						aria-label="Clear search"
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Conversation turns -->
	<div class="space-y-8">
		{#each thread.turns as turn, i (i)}
			<div
				bind:this={turnEls[i]}
				class="animate-slide-up transition-opacity duration-200 {isSearching &&
				!matchingIndices.includes(i)
					? 'opacity-20'
					: ''} {activeTurnIndex === i ? 'ring-1 ring-accent/30 rounded-lg' : ''}"
				style="--delay: {Math.min(i * 40, 600)}ms"
			>
				{#if turn.role === 'user'}
					<UserMessage {turn} {query} />
				{:else}
					<AssistantMessage {turn} {query} />
				{/if}
			</div>
		{/each}
	</div>
</div>
