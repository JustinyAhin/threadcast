<script lang="ts">
	import Seo from '$lib/components/seo.svelte';
	import ThreadView from '$lib/components/thread/thread-view.svelte';

	let { data } = $props();

	const ogImage = $derived(
		data.thread.metadata.visibility === 'public' ? `/og/threads/${data.id}.png` : undefined
	);
</script>

<Seo
	title="{data.thread.metadata.title} — ThreadCast"
	description="Claude Code session by {data.thread.uploader.githubUsername} — {data.thread.metadata
		.messageCount} messages, {data.thread.metadata.duration}"
	ogType="article"
	{ogImage}
/>

<div class="px-4 py-6 sm:px-6 sm:py-10">
	<ThreadView thread={data.thread} threadId={data.id} isOwner={data.isOwner} />
</div>
