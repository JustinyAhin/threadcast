<!-- <script lang="ts">
	import { highlightProse } from '$lib/actions/highlight-prose';
	import Seo from '$lib/components/seo.svelte';
	import { renderMarkdown } from '$lib/markdown';

	let { data } = $props();

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<Seo
	title={`${data.changelog.title} — Changelog — ThreadCast`}
	description={data.changelog.summary}
/>
<div class="px-6 py-10">
	<div class="mx-auto max-w-4xl">
		<div class="mb-8 animate-fade-in">
			<a
				href="/changelogs"
				class="mb-4 inline-flex items-center gap-1 font-mono text-xs text-text-muted transition-colors hover:text-text"
			>
				&larr; All changes
			</a>
			<time class="mt-4 block font-mono text-xs text-accent">
				{formatDate(data.changelog.date)}
			</time>
			<h1 class="mt-1 text-3xl font-bold text-text">{data.changelog.title}</h1>
			<p class="mt-2 text-text-secondary">{data.changelog.summary}</p>
		</div>

		<div class="animate-slide-up prose text-sm text-text" style="--delay: 100ms" use:highlightProse>
			eslint-disable-next-line svelte/no-at-html-tags
			{@html renderMarkdown(data.changelog.content)}
		</div>
	</div>
</div> -->
