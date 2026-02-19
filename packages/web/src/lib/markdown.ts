import { marked } from 'marked';

marked.use({
	gfm: true,
	breaks: true,
	renderer: {
		html({ text }) {
			return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
	}
});

const renderMarkdown = (text: string): string => {
	return marked.parse(text, { async: false }) as string;
};

export { renderMarkdown };
