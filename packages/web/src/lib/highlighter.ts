import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

let highlighterPromise: Promise<HighlighterCore> | null = null;

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
		highlighterPromise = createHighlighterCore({
			themes: [import('shiki/dist/themes/vitesse-dark.mjs')],
			langs: [
				import('shiki/dist/langs/bash.mjs'),
				import('shiki/dist/langs/typescript.mjs'),
				import('shiki/dist/langs/javascript.mjs'),
				import('shiki/dist/langs/json.mjs'),
				import('shiki/dist/langs/css.mjs'),
				import('shiki/dist/langs/html.mjs'),
				import('shiki/dist/langs/svelte.mjs'),
				import('shiki/dist/langs/python.mjs'),
				import('shiki/dist/langs/yaml.mjs'),
				import('shiki/dist/langs/markdown.mjs')
			],
			engine: createJavaScriptRegexEngine()
		});
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
