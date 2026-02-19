<script lang="ts">
	import { PUBLIC_OG_URL } from '$env/static/public';
	import { page } from '$app/state';

	type Props = {
		title: string;
		description?: string;
		ogImage?: string;
		ogType?: string;
		robots?: string;
	};

	const { title, description, ogImage, ogType = 'website', robots }: Props = $props();

	const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`);
	const ogImageUrl = $derived.by(() => {
		if (!ogImage) return `${PUBLIC_OG_URL}/og/home.png`;
		return `${PUBLIC_OG_URL}${ogImage}`;
	});
	const isProduction = $derived(page.url.hostname === 'threadcast.dev');
	const isLocalhost = $derived(page.url.hostname === 'localhost');
	const effectiveRobots = $derived(
		isProduction || isLocalhost ? (robots ?? 'index, follow') : 'noindex, nofollow'
	);
</script>

<svelte:head>
	<title>{title}</title>

	{#if description}
		<meta name="description" content={description} />
	{/if}

	<meta name="robots" content={effectiveRobots} />

	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if ogImageUrl}
		<meta property="og:image" content={ogImageUrl} />
	{/if}

	<!-- Twitter Card -->
	{#if ogImageUrl}
		<meta name="twitter:card" content="summary_large_image" />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	<meta name="twitter:title" content={title} />
	{#if description}
		<meta name="twitter:description" content={description} />
	{/if}
	{#if ogImageUrl}
		<meta name="twitter:image" content={ogImageUrl} />
	{/if}
</svelte:head>
