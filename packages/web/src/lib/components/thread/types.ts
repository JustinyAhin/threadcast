type SkillBlock = {
	raw: string;
	name: string;
	path: string;
	title: string;
	description: string;
	body: string;
	frontmatter: Record<string, string>;
};

type MessagePart =
	| {
			type: 'markdown';
			text: string;
	  }
	| {
			type: 'skill';
			skill: SkillBlock;
	  };

export type { MessagePart, SkillBlock };
