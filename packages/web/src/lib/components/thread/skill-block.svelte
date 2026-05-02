<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import { highlightProse } from '$lib/actions/highlight-prose';
	import type { SkillBlock } from './types';
	import { getShortPath } from './skill-blocks';

	let { skill }: { skill: SkillBlock } = $props();
	let expanded = $state(false);

	const displayName = $derived(skill.name || skill.title);
	const shortPath = $derived(getShortPath(skill.path));
</script>

<div class="rounded-md border border-cyan-500/20 bg-cyan-950/20">
	<button
		class="flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cyan-500/5"
		onclick={() => (expanded = !expanded)}
		aria-expanded={expanded}
	>
		<span
			class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10 font-mono text-[10px] font-semibold text-cyan-300"
		>
			S
		</span>
		<span class="min-w-0 flex-1">
			<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
				<span class="font-mono text-xs font-semibold text-cyan-300">Skill</span>
				<span class="min-w-0 truncate text-sm font-semibold text-text">{skill.title}</span>
				{#if displayName && displayName !== skill.title}
					<span class="truncate font-mono text-xs text-text-muted">{displayName}</span>
				{/if}
			</span>
			{#if skill.description}
				<span class="mt-1 line-clamp-2 block text-xs leading-5 text-text-secondary">
					{skill.description}
				</span>
			{/if}
			{#if shortPath}
				<span class="mt-1 block truncate font-mono text-[11px] text-text-muted">{shortPath}</span>
			{/if}
		</span>
		<span
			class="mt-1 shrink-0 text-xs text-text-muted transition-transform"
			class:rotate-90={expanded}>&#9654;</span
		>
	</button>

	{#if expanded}
		<div class="animate-expand border-t border-cyan-500/15 px-3 py-3">
			<div class="mb-3 grid gap-2 text-xs sm:grid-cols-[5rem_minmax(0,1fr)]">
				<div class="font-mono text-text-muted">Name</div>
				<div class="min-w-0 break-words font-mono text-text-secondary">{displayName}</div>
				{#if skill.path}
					<div class="font-mono text-text-muted">Path</div>
					<div class="min-w-0 break-words font-mono text-text-secondary">{skill.path}</div>
				{/if}
			</div>

			{#if skill.body}
				<div class="prose text-sm text-text" use:highlightProse>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderMarkdown(skill.body)}
				</div>
			{/if}
		</div>
	{/if}
</div>
