<script lang="ts">
	import ThreadView from '$lib/components/thread/thread-view.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.thread.metadata.title} — ThreadCast</title>
	<meta name="description" content="Claude Code session by {data.thread.uploader.githubUsername}" />

	<!-- OG tags -->
	<meta property="og:title" content="{data.thread.metadata.title} — ThreadCast" />
	<meta
		property="og:description"
		content="Claude Code session by {data.thread.uploader.githubUsername} — {data.thread.metadata
			.messageCount} messages, {data.thread.metadata.duration}"
	/>
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://threadcast.dev/threads/{data.id}" />
</svelte:head>

<ThreadView thread={data.thread} threadId={data.id} />
