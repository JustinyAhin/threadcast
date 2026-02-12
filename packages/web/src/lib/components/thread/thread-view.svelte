<script lang="ts">
	import type { ThreadData } from '@threadcast/shared';
	import UserMessage from './user-message.svelte';
	import AssistantMessage from './assistant-message.svelte';
	import ThreadSidebar from './thread-sidebar.svelte';
	import ChatNav from './chat-nav.svelte';
	import { activeElement } from 'runed';
	import { browser } from '$app/environment';

	let { thread }: { thread: ThreadData } = $props();

	let query = $state('');
	let inputEl = $state<HTMLInputElement>();
	let activeTurnIndex = $state(-1);
	let turnEls = $state<(HTMLDivElement | null)[]>([]);
	let activeUserTurnIndex = $state(-1);

	const userTurnEls = $derived(
		turnEls.filter((_, i) => thread.turns[i]?.role === 'user').filter(Boolean) as HTMLElement[]
	);

	$effect(() => {
		if (!browser) return;
		const els = userTurnEls;
		if (els.length === 0) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const idx = turnEls.indexOf(entry.target as HTMLDivElement);
						if (idx !== -1) activeUserTurnIndex = idx;
					}
				}
			},
			{ rootMargin: '-20% 0px -60% 0px' }
		);
		for (const el of els) observer.observe(el);
		return () => observer.disconnect();
	});

	const navigateToTurn = (turnIndex: number) => {
		const el = turnEls[turnIndex];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			activeUserTurnIndex = turnIndex;
		}
	};

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

	// Auto-scroll to first match when results change
	$effect(() => {
		if (matchingIndices.length > 0) {
			activeTurnIndex = matchingIndices[0];
			scrollToTurn(activeTurnIndex);
		} else if (isSearching) {
			activeTurnIndex = -1;
		}
	});

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
		const inputFocused = activeElement.current === inputEl;
		if (e.key === '/' && !inputFocused) {
			e.preventDefault();
			inputEl?.focus();
		}
		if (e.key === 'Escape' && inputFocused) {
			if (query) {
				query = '';
				activeTurnIndex = -1;
			} else {
				inputEl?.blur();
			}
		}
		if (e.key === 'Enter' && inputFocused) {
			e.preventDefault();
			goToMatch(e.shiftKey ? 'prev' : 'next');
		}
	};
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mx-auto flex max-w-7xl items-start gap-8">
	<ChatNav turns={thread.turns} activeTurnIndex={activeUserTurnIndex} onNavigate={navigateToTurn} />

	<div class="min-w-0 max-w-4xl flex-1">
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
					class="animate-slide-up {isSearching && !matchingIndices.includes(i)
						? 'hidden'
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

	<ThreadSidebar {thread} />
</div>
