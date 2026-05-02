<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';
	import { highlightProse } from '$lib/actions/highlight-prose';
	import { highlightSearch } from '$lib/actions/highlight-search';
	import SkillBlock from './skill-block.svelte';
	import { parseMessageParts } from './skill-blocks';

	let { text, query = '' }: { text: string; query?: string } = $props();

	const parts = $derived(parseMessageParts(text));
</script>

<div class="space-y-3" use:highlightSearch={query}>
	{#each parts as part, i (i)}
		{#if part.type === 'markdown'}
			<div class="prose text-sm text-text" use:highlightProse>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html renderMarkdown(part.text)}
			</div>
		{:else}
			<SkillBlock skill={part.skill} />
		{/if}
	{/each}
</div>
