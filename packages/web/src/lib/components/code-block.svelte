<script lang="ts">
	import { highlightCode } from '$lib/highlighter';

	let { code, lang, maxHeight }: { code: string; lang?: string; maxHeight?: string } = $props();

	let highlightedHtml = $state('');

	$effect(() => {
		const currentCode = code;
		const currentLang = lang;
		highlightCode({ code: currentCode, lang: currentLang }).then((html) => {
			highlightedHtml = html;
		});
	});
</script>

{#if highlightedHtml}
	<div class="code-block overflow-auto rounded" style:max-height={maxHeight}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html highlightedHtml}
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
