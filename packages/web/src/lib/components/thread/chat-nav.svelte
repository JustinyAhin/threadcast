<script lang="ts">
	import type { ProcessedTurn } from '@threadcast/shared';

	let {
		turns,
		activeTurnIndex = -1,
		onNavigate
	}: {
		turns: ProcessedTurn[];
		activeTurnIndex?: number;
		onNavigate: (turnIndex: number) => void;
	} = $props();

	const userTurns = $derived(
		turns
			.map((turn, index) => ({ turn, index }))
			.filter(({ turn }) => turn.role === 'user')
			.map(({ turn, index }, userIndex) => {
				const text = turn.content
					.filter((b) => b.type === 'text')
					.map((b) => (b as { type: 'text'; text: string }).text)
					.join(' ')
					.replace(/\n+/g, ' ')
					.trim();
				return { turnIndex: index, userNumber: userIndex + 1, text };
			})
	);
</script>

<nav class="sticky top-8 hidden w-56 shrink-0 xl:block">
	<h3 class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Prompts</h3>
	<ol class="max-h-[calc(100vh-6rem)] space-y-1 overflow-y-auto">
		{#each userTurns as { turnIndex, userNumber, text } (turnIndex)}
			<li>
				<button
					onclick={() => onNavigate(turnIndex)}
					class="group flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors {activeTurnIndex ===
					turnIndex
						? 'bg-cyan-600/15 text-cyan-400'
						: 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'}"
				>
					<span
						class="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold {activeTurnIndex ===
						turnIndex
							? 'bg-cyan-600/30 text-cyan-400'
							: 'bg-surface-2 text-text-muted group-hover:text-text-secondary'}"
					>
						{userNumber}
					</span>
					<span class="min-w-0 flex-1 truncate text-xs leading-5">
						{text || 'Empty prompt'}
					</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>
