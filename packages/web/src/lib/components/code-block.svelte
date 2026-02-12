<script lang="ts">
	import { highlightCode } from '$lib/highlighter';
	import { resource } from 'runed';

	let { code, lang, maxHeight }: { code: string; lang?: string; maxHeight?: string } = $props();

	const highlighted = resource([() => code, () => lang], async ([code, lang]) =>
		highlightCode({ code, lang })
	);
</script>

{#if highlighted.current}
	<div class="code-block overflow-auto rounded" style:max-height={maxHeight}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html highlighted.current}
	</div>
{:else}
	<pre
		class="overflow-auto rounded bg-surface-1 p-3 font-mono text-xs text-text-secondary"
		style:max-height={maxHeight}>{code}</pre>
{/if}

<style>
	.code-block :global(pre) {
		padding: 0.75rem;
		font-size: 0.75rem;
		line-height: 1.25rem;
		border-radius: 0.375rem;
		overflow: auto;
	}

	.code-block :global(pre code) {
		font-family: inherit;
	}
</style>
