<script lang="ts">
	type Props = {
		size?: 'sm' | 'md' | 'lg';
	};

	let { size = 'md' }: Props = $props();

	const sizeClass = $derived(size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6');
</script>

<svg
	class={sizeClass}
	viewBox="0 0 64 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Three thread lines -->
	<line x1="14" y1="8" x2="14" y2="56" stroke="#78716c" stroke-width="4" stroke-linecap="round" />
	<line x1="30" y1="8" x2="30" y2="56" stroke="#78716c" stroke-width="4" stroke-linecap="round" />
	<line x1="46" y1="8" x2="46" y2="56" stroke="#78716c" stroke-width="4" stroke-linecap="round" />

	<!-- Amber nodes -->
	<circle cx="14" cy="20" r="5.5" fill="#f59e0b" />
	<circle cx="30" cy="36" r="5.5" fill="#f59e0b" />
	<circle cx="46" cy="20" r="5.5" fill="#f59e0b" />
</svg>
