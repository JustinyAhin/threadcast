<script lang="ts">
	import { diffLines, type Change } from 'diff';

	let { oldCode, newCode, fileName }: { oldCode: string; newCode: string; fileName: string } =
		$props();

	type DiffLine = {
		id: string;
		type: 'add' | 'remove' | 'context';
		marker: '+' | '-' | ' ';
		text: string;
		oldLine: number | null;
		newLine: number | null;
	};

	const splitLines = (value: string) => {
		const normalized = value.endsWith('\n') ? value.slice(0, -1) : value;
		return normalized.split('\n');
	};

	const createRows = (changes: Change[]) => {
		const rows: DiffLine[] = [];
		let oldLine = 1;
		let newLine = 1;

		for (const change of changes) {
			const lines = splitLines(change.value);

			for (const text of lines) {
				if (change.added) {
					rows.push({
						id: `${rows.length}-add-${newLine}`,
						type: 'add',
						marker: '+',
						text,
						oldLine: null,
						newLine
					});
					newLine += 1;
					continue;
				}

				if (change.removed) {
					rows.push({
						id: `${rows.length}-remove-${oldLine}`,
						type: 'remove',
						marker: '-',
						text,
						oldLine,
						newLine: null
					});
					oldLine += 1;
					continue;
				}

				rows.push({
					id: `${rows.length}-context-${oldLine}-${newLine}`,
					type: 'context',
					marker: ' ',
					text,
					oldLine,
					newLine
				});
				oldLine += 1;
				newLine += 1;
			}
		}

		return rows;
	};

	const rows = $derived(createRows(diffLines(oldCode, newCode)));
</script>

<div class="max-h-96 overflow-auto rounded border border-border bg-surface-1">
	<div class="border-b border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text-muted">
		{fileName}
	</div>

	<pre class="m-0 min-w-max overflow-visible py-2 font-mono text-xs leading-5">
    	<code>
    		{#each rows as row (row.id)}<span
					class={[
						'grid grid-cols-[3.25rem_3.25rem_1.5rem_minmax(0,1fr)] px-3',
						row.type === 'add' && 'bg-emerald-500/10 text-emerald-100',
						row.type === 'remove' && 'bg-red-500/10 text-red-100',
						row.type === 'context' && 'text-text-secondary'
					]
						.filter(Boolean)
						.join(' ')}>
    					<span class="select-none text-right text-text-muted">{row.oldLine ?? ''}</span>
    					<span class="select-none text-right text-text-muted">{row.newLine ?? ''}</span>
    					<span
						class={[
							'select-none pl-3',
							row.type === 'add' && 'text-emerald-400',
							row.type === 'remove' && 'text-red-400',
							row.type === 'context' && 'text-text-muted'
						]
							.filter(Boolean)
							.join(' ')}>
    						{row.marker}
    					</span>
    					<span class="whitespace-pre pr-3">{row.text || ' '}</span>
    				</span>
			{/each}
    	</code>
	</pre>
</div>
