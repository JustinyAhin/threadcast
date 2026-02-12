import { marked } from 'marked';

marked.setOptions({
	gfm: true,
	breaks: true
});

const renderMarkdown = (text: string): string => {
	return marked.parse(text, { async: false }) as string;
};

export { renderMarkdown };
