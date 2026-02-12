<script lang="ts">
	import { FileDiff, parseDiffFromFile, getFiletypeFromFileName } from '@pierre/diffs';
	import type { FileContents } from '@pierre/diffs';

	let { oldCode, newCode, fileName }: { oldCode: string; newCode: string; fileName: string } =
		$props();

	let container: HTMLDivElement;

	$effect(() => {
		if (!container) return;

		const lang = getFiletypeFromFileName(fileName);

		const oldFile: FileContents = { name: fileName, contents: oldCode, lang };
		const newFile: FileContents = { name: fileName, contents: newCode, lang };

		const fileDiff = parseDiffFromFile(oldFile, newFile);

		const instance = new FileDiff({
			theme: 'pierre-dark',
			themeType: 'dark',
			diffStyle: 'unified',
			diffIndicators: 'bars',
			disableFileHeader: true,
			overflow: 'scroll'
		} as const);

		instance.render({ oldFile, newFile, fileDiff, containerWrapper: container });

		return () => {
			instance.cleanUp();
		};
	});
</script>

<div bind:this={container} class="diff-container max-h-96 overflow-auto rounded"></div>

<style>
	.diff-container {
		--diffs-font-size: 12px;
		--diffs-line-height: 18px;
	}

	.diff-container :global([data-diffs]) {
		border-radius: 0.375rem;
	}
</style>
