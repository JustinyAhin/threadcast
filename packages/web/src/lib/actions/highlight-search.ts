const highlightTextNode = (textNode: Text, query: string) => {
	const text = textNode.textContent || '';
	const lower = text.toLowerCase();

	if (!lower.includes(query)) return;

	const frag = document.createDocumentFragment();
	let lastIndex = 0;
	let idx = lower.indexOf(query, lastIndex);

	while (idx !== -1) {
		if (idx > lastIndex) {
			frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
		}
		const mark = document.createElement('mark');
		mark.className = 'search-highlight';
		mark.textContent = text.slice(idx, idx + query.length);
		frag.appendChild(mark);

		lastIndex = idx + query.length;
		idx = lower.indexOf(query, lastIndex);
	}

	if (lastIndex < text.length) {
		frag.appendChild(document.createTextNode(text.slice(lastIndex)));
	}

	textNode.parentNode?.replaceChild(frag, textNode);
};

const cleanup = (node: HTMLElement) => {
	node.querySelectorAll('mark.search-highlight').forEach((mark) => {
		const parent = mark.parentNode;
		if (parent) {
			parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
			parent.normalize();
		}
	});
};

const apply = (node: HTMLElement, query: string) => {
	cleanup(node);
	const q = query.trim().toLowerCase();
	if (!q) return;

	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let current: Node | null;
	while ((current = walker.nextNode())) {
		const parent = (current as Text).parentElement;
		if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) continue;
		textNodes.push(current as Text);
	}

	textNodes.forEach((tn) => highlightTextNode(tn, q));
};

const highlightSearch = (node: HTMLElement, query: string) => {
	apply(node, query);

	return {
		update: (newQuery: string) => apply(node, newQuery),
		destroy: () => cleanup(node)
	};
};

export { highlightSearch };
