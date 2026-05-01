<script lang="ts">
	import Seo from '$lib/components/seo.svelte';
	import ThreadCard from '$lib/components/thread-card.svelte';
	import { authClient } from '$lib/client/auth';

	const session = authClient.useSession();

	let { data } = $props();

	let query = $state('');
	let activeTools = $state<string[]>([]);
	let activeProjects = $state<string[]>([]);
	let dateFrom = $state('');
	let dateTo = $state('');
	let activeDatePreset = $state<string | null>(null);

	const dateStr = (offsetDays: number) => {
		const ms = Date.now() - offsetDays * 86_400_000;
		const d = new Date(ms);
		return d.toISOString().slice(0, 10);
	};

	const DATE_PRESETS = [
		{ label: 'Today', offset: 0, range: true },
		{ label: 'Yesterday', offset: 1, range: true },
		{ label: '7d', offset: 7, range: false },
		{ label: '30d', offset: 30, range: false },
		{ label: '90d', offset: 90, range: false }
	] as const;

	const applyPreset = (preset: (typeof DATE_PRESETS)[number]) => {
		if (activeDatePreset === preset.label) {
			dateFrom = '';
			dateTo = '';
			activeDatePreset = null;
		} else {
			dateFrom = dateStr(preset.offset);
			dateTo = preset.range ? dateStr(preset.offset === 1 ? 1 : 0) : '';
			activeDatePreset = preset.label;
		}
	};

	const onDateInput = () => {
		activeDatePreset = null;
	};

	const allTools = $derived([...new Set(data.threads.flatMap((t) => t.metadata.toolsUsed))].sort());
	const allProjects = $derived(
		[...new Set(data.threads.map((t) => t.metadata.projectName))].sort()
	);

	const toggleTool = (tool: string) => {
		if (activeTools.includes(tool)) {
			activeTools = activeTools.filter((t) => t !== tool);
		} else {
			activeTools = [...activeTools, tool];
		}
	};

	const toggleProject = (project: string) => {
		if (activeProjects.includes(project)) {
			activeProjects = activeProjects.filter((p) => p !== project);
		} else {
			activeProjects = [...activeProjects, project];
		}
	};

	const TOOL_COLORS: Record<string, string> = {
		Bash: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
		Read: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
		Edit: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
		Write: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
		Grep: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
		Glob: 'bg-teal-500/15 text-teal-400 ring-teal-500/30',
		WebFetch: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30',
		WebSearch: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30',
		Task: 'bg-rose-500/15 text-rose-400 ring-rose-500/30'
	};

	const filteredThreads = $derived.by(() => {
		const q = query.toLowerCase().trim();

		return data.threads.filter((thread) => {
			// Date range filter
			if (dateFrom) {
				const created = thread.metadata.created.slice(0, 10);
				if (created < dateFrom) return false;
			}
			if (dateTo) {
				const created = thread.metadata.created.slice(0, 10);
				if (created > dateTo) return false;
			}

			// Project filter
			if (activeProjects.length > 0) {
				if (!activeProjects.includes(thread.metadata.projectName)) return false;
			}

			// Tool filter
			if (activeTools.length > 0) {
				const hasAllTools = activeTools.every((t) => thread.metadata.toolsUsed.includes(t));
				if (!hasAllTools) return false;
			}

			// Text search
			if (!q) return true;
			return (
				thread.metadata.title.toLowerCase().includes(q) ||
				thread.metadata.projectName.toLowerCase().includes(q) ||
				thread.uploader.githubUsername.toLowerCase().includes(q)
			);
		});
	});

	const hasActiveFilters = $derived(
		query.trim().length > 0 ||
			activeTools.length > 0 ||
			activeProjects.length > 0 ||
			dateFrom !== '' ||
			dateTo !== ''
	);

	const clearAll = () => {
		query = '';
		activeTools = [];
		activeProjects = [];
		dateFrom = '';
		dateTo = '';
	};

	let inputEl = $state<HTMLInputElement>();

	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === '/' && document.activeElement !== inputEl) {
			e.preventDefault();
			inputEl?.focus();
		}
		if (e.key === 'Escape' && document.activeElement === inputEl) {
			query = '';
			inputEl?.blur();
		}
	};
</script>

<svelte:window onkeydown={onKeydown} />

<Seo
	title="Threads — ThreadCast"
	description="Browse Claude Code sessions shared by developers — real coding conversations, preserved for everyone."
/>

<div class="px-6 py-10">
	<div class="mx-auto max-w-4xl">
		<div class="mb-10 animate-fade-in">
			<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">
				Claude Code Sessions
			</p>
			<h1 class="mb-3 text-4xl font-bold text-text">Conversations worth reading.</h1>
			<p class="max-w-lg text-text-secondary">
				Real coding sessions with Claude — shared by developers, preserved for everyone.
			</p>
		</div>

		{#if data.threads.length === 0}
			<div class="rounded-lg border border-border bg-surface-1 p-12 text-center">
				<p class="mb-2 text-lg text-text-secondary">No threads yet</p>
				<p class="text-sm text-text-muted">
					Share your first session with <code
						class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-accent"
						>/threadcast:share</code
					>
				</p>
				{#if !$session.data}
					<a
						href="/login"
						class="mt-4 inline-block cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
					>
						Sign in with GitHub
					</a>
				{/if}
			</div>
		{:else}
			<!-- Search & filter bar -->
			<div class="mb-6 animate-fade-in" style="--delay: 100ms">
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
						<svg
							class="h-4 w-4 text-text-muted"
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
						placeholder="Search threads..."
						class="w-full rounded-lg border border-border bg-surface-1 py-2.5 pr-12 pl-10 font-mono text-sm text-text placeholder-text-muted transition-colors focus:border-border-light focus:outline-none"
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 font-mono text-xs text-text-muted"
					>
						/
					</div>
				</div>

				<!-- Filter rows -->
				<div class="mt-3 flex flex-col gap-2.5">
					<!-- Date range filter -->
					<div class="flex items-center gap-2">
						<span class="w-14 shrink-0 font-mono text-xs text-text-muted">Date</span>
						<div class="flex flex-wrap items-center gap-1.5">
							{#each DATE_PRESETS as preset (preset.label)}
								<button
									onclick={() => applyPreset(preset)}
									class="cursor-pointer rounded-full px-2.5 py-0.5 text-xs transition-all {activeDatePreset ===
									preset.label
										? 'bg-accent/15 text-accent ring-1 ring-accent/30'
										: 'bg-surface-2 text-text-muted hover:text-text-secondary'}"
								>
									{preset.label}
								</button>
							{/each}
							<span class="mx-1 h-3 w-px bg-border"></span>
							<input
								type="date"
								bind:value={dateFrom}
								oninput={onDateInput}
								class="date-input rounded border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-text-secondary transition-colors focus:border-border-light focus:outline-none"
							/>
							<span class="font-mono text-xs text-text-muted">&ndash;</span>
							<input
								type="date"
								bind:value={dateTo}
								oninput={onDateInput}
								class="date-input rounded border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-text-secondary transition-colors focus:border-border-light focus:outline-none"
							/>
						</div>
					</div>

					<!-- Project filter -->
					{#if allProjects.length > 1}
						<div class="flex items-center gap-2">
							<span class="w-14 shrink-0 font-mono text-xs text-text-muted">Project</span>
							<div class="flex flex-wrap gap-1.5">
								{#each allProjects as project (project)}
									<button
										onclick={() => toggleProject(project)}
										class="cursor-pointer rounded-full px-2.5 py-0.5 text-xs transition-all {activeProjects.includes(
											project
										)
											? 'bg-accent/15 text-accent ring-1 ring-accent/30'
											: 'bg-surface-2 text-text-muted hover:text-text-secondary'}"
									>
										{project}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Tool filter -->
					{#if allTools.length > 0}
						<div class="flex items-center gap-2">
							<span class="w-14 shrink-0 font-mono text-xs text-text-muted">Tools</span>
							<div class="flex flex-wrap gap-1.5">
								{#each allTools as tool (tool)}
									<button
										onclick={() => toggleTool(tool)}
										class="cursor-pointer rounded-full px-2.5 py-0.5 text-xs transition-all {activeTools.includes(
											tool
										)
											? `${TOOL_COLORS[tool] || 'bg-surface-2 text-text-muted ring-border'} ring-1`
											: 'bg-surface-2 text-text-muted hover:text-text-secondary'}"
									>
										{tool}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if hasActiveFilters}
					<div class="mt-3 flex items-center justify-between border-t border-border pt-2">
						<p class="font-mono text-xs text-text-muted">
							{filteredThreads.length}
							{filteredThreads.length === 1 ? 'result' : 'results'}
						</p>
						<button
							onclick={clearAll}
							class="cursor-pointer font-mono text-xs text-text-muted transition-colors hover:text-accent"
						>
							Clear filters
						</button>
					</div>
				{/if}
			</div>

			{#if filteredThreads.length === 0}
				<div class="rounded-lg border border-border bg-surface-1 p-12 text-center">
					<p class="mb-2 text-text-secondary">No threads match your search</p>
					<p class="text-sm text-text-muted">Try a different query or clear the filters</p>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each filteredThreads as thread, i (thread.id)}
						<div class="animate-slide-up" style="--delay: {Math.min(i * 60, 400)}ms">
							<ThreadCard {thread} {query} />
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
