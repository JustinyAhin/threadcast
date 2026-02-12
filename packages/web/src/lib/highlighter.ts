import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

const LANGS = [
	'bash',
	'typescript',
	'javascript',
	'json',
	'css',
	'html',
	'svelte',
	'python',
	'yaml',
	'markdown'
] as const;

const THEME = 'vitesse-dark';

const EXT_TO_LANG: Record<string, string> = {
	'.ts': 'typescript',
	'.tsx': 'typescript',
	'.js': 'javascript',
	'.jsx': 'javascript',
	'.json': 'json',
	'.css': 'css',
	'.html': 'html',
	'.svelte': 'svelte',
	'.py': 'python',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.md': 'markdown',
	'.sh': 'bash',
	'.bash': 'bash',
	'.zsh': 'bash'
};

const getHighlighter = () => {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({ themes: [THEME], langs: [...LANGS] });
	}
	return highlighterPromise;
};

const highlightCode = async ({ code, lang }: { code: string; lang?: string }): Promise<string> => {
	const h = await getHighlighter();
	const resolvedLang = lang && h.getLoadedLanguages().includes(lang) ? lang : 'text';
	return h.codeToHtml(code, { lang: resolvedLang, theme: THEME });
};

const guessLang = (filePath: string): string | undefined => {
	const dot = filePath.lastIndexOf('.');
	if (dot === -1) return undefined;
	return EXT_TO_LANG[filePath.slice(dot)];
};

export { highlightCode, guessLang };
