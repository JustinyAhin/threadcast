const escapeHtml = (str: string) =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const highlightText = (text: string, query: string): string => {
	const q = query.trim();
	if (!q) return escapeHtml(text);

	const escaped = escapeHtml(text);
	const escapedQuery = escapeHtml(q);
	const regexSafe = escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${regexSafe})`, 'gi');
	return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
};

export { highlightText };
