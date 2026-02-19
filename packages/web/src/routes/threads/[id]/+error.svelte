<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex flex-1 items-center justify-center px-4">
	<div class="flex flex-col items-center gap-4">
		<p class="font-mono text-8xl font-bold text-accent/30 select-none">{page.status}</p>
		<p class="text-lg font-semibold text-text">{page.error?.message || 'Something went wrong'}</p>
		<p class="text-sm text-text/60">
			This thread may have been removed, or perhaps it never existed.
		</p>
		<a
			href="/"
			class="mt-2 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
		>
			Go home
		</a>
	</div>
</div>
