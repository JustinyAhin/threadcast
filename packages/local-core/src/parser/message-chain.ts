import type { RawJsonlLine } from "@threadcast/shared";

const buildMessageChain = (messages: RawJsonlLine[]): RawJsonlLine[] => {
  if (messages.length === 0) return [];

  const byUuid = new Map<string, RawJsonlLine>();
  const childrenOf = new Map<string, RawJsonlLine[]>();

  for (const msg of messages) {
    if (msg.uuid) {
      byUuid.set(msg.uuid, msg);
    }
    const parent = msg.parentUuid;
    if (parent) {
      const siblings = childrenOf.get(parent) || [];
      siblings.push(msg);
      childrenOf.set(parent, siblings);
    }
  }

  const roots = messages.filter(
    (m) => !m.parentUuid || !byUuid.has(m.parentUuid)
  );

  if (roots.length === 0) return messages;

  const chain: RawJsonlLine[] = [];
  const visited = new Set<string>();

  const walk = (node: RawJsonlLine) => {
    if (visited.has(node.uuid)) return;
    visited.add(node.uuid);
    chain.push(node);

    const children = childrenOf.get(node.uuid);
    if (children && children.length > 0) {
      for (const child of children) {
        walk(child);
      }
    }
  };

  for (const root of roots) {
    walk(root);
  }

  return chain;
};

export { buildMessageChain };
