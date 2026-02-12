import { highlightCode } from '$lib/highlighter';

const highlightProse = (node: HTMLElement) => {
	const run = () => {
		const blocks = node.querySelectorAll<HTMLElement>('pre code[class*="language-"]');
		blocks.forEach((codeEl) => {
			const match = codeEl.className.match(/language-(\w+)/);
			if (!match) return;
			const lang = match[1];
			const text = codeEl.textContent || '';
			const pre = codeEl.parentElement;
			if (!pre || pre.dataset.highlighted) return;
			pre.dataset.highlighted = 'true';

			highlightCode({ code: text, lang }).then((html) => {
				const temp = document.createElement('div');
				temp.innerHTML = html;
				const newPre = temp.querySelector('pre');
				if (newPre && pre.parentNode) {
					newPre.className = `${pre.className} ${newPre.className}`;
					pre.parentNode.replaceChild(newPre, pre);
				}
			});
		});
	};

	run();

	return {
		update: run
	};
};

export { highlightProse };
