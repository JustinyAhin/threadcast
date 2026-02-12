<script lang="ts">
	let { data } = $props();

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<svelte:head>
	<title>Changelog — ThreadCast</title>
	<meta
		name="description"
		content="What's new in ThreadCast — release notes and product updates."
	/>
</svelte:head>

<div class="px-6 py-10">
	<div class="mx-auto max-w-4xl">
		<div class="mb-10 animate-fade-in">
			<p class="mb-3 font-mono text-xs tracking-widest text-text-muted uppercase">Changelog</p>
			<h1 class="mb-2 text-3xl font-bold text-text">What's new in ThreadCast</h1>
			<p class="text-text-secondary">Product updates, new features, and improvements.</p>
		</div>

		<div class="relative space-y-0">
			{#each data.changelogs as entry, i (entry.slug)}
				<div
					class="animate-slide-up relative border-l-2 border-border pb-10 pl-8 last:pb-0"
					style="--delay: {Math.min(i * 80, 400)}ms"
				>
					<div class="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent"></div>
					<time class="font-mono text-xs text-accent">{formatDate(entry.date)}</time>
					<h2 class="mt-1 text-xl font-semibold text-text">
						<a href="/changelogs/{entry.slug}" class="transition-colors hover:text-accent">
							{entry.title}
						</a>
					</h2>
					<p class="mt-2 text-sm text-text-secondary">{entry.summary}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
