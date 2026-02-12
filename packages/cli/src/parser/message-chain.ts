import type { RawJsonlLine } from "@threadcast/shared";

/**
 * Reconstructs the message chain from parentUuid -> uuid links.
 *
 * Claude Code JSONL messages form a tree via parentUuid/uuid.
 * We follow the main chain (non-sidechain) to get the linear conversation.
 *
 * Strategy:
 * 1. Build a map of uuid -> message
 * 2. Build a map of parentUuid -> children
 * 3. Find the root (first message with no parentUuid or parentUuid not in our set)
 * 4. Walk the chain, always following the last child at each step
 *    (since Claude Code appends messages chronologically, the last child
 *     at each node is the "current" continuation of the conversation)
 */
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

  // Find root: message whose parentUuid is not in our message set
  const roots = messages.filter(
    (m) => !m.parentUuid || !byUuid.has(m.parentUuid)
  );

  if (roots.length === 0) return messages; // fallback

  // Start from the first root and walk the chain
  const chain: RawJsonlLine[] = [];
  const visited = new Set<string>();

  const walk = (node: RawJsonlLine) => {
    if (visited.has(node.uuid)) return;
    visited.add(node.uuid);
    chain.push(node);

    const children = childrenOf.get(node.uuid);
    if (children && children.length > 0) {
      // Follow all children in order (they form the continuation)
      for (const child of children) {
        walk(child);
      }
    }
  };

  // Walk all roots — filtered-out messages (isMeta, system, etc.) can break
  // the parent chain, creating multiple disconnected subtrees.
  for (const root of roots) {
    walk(root);
  }

  return chain;
};

export { buildMessageChain };
