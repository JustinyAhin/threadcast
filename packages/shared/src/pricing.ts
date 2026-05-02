import type { ModelPricing, ProcessedTurn } from "./types";

const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI GPT-5.5
  "gpt-5.5": { input: 5, cachedInput: 0.5, output: 30 },
  // OpenAI GPT-5.4
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.4": { input: 2.5, cachedInput: 0.25, output: 15 },
  // OpenAI GPT-5
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2 },
  "gpt-5-nano": { input: 0.05, cachedInput: 0.005, output: 0.4 },
  "gpt-5": { input: 1.25, cachedInput: 0.125, output: 10 },
  // Claude 4.6
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  // Claude 4.5
  "claude-opus-4-5": { input: 5, output: 25 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  // Claude 4.1
  "claude-opus-4-1": { input: 15, output: 75 },
  // Claude 4.0
  "claude-opus-4-0": { input: 15, output: 75 },
  "claude-sonnet-4-0": { input: 3, output: 15 },
  // Claude 3.7
  "claude-3-7-sonnet": { input: 3, output: 15 },
  // Claude 3.5
  "claude-3-5-sonnet": { input: 3, output: 15 },
  // Claude 3
  "claude-3-haiku": { input: 0.25, output: 1.25 },
};

const FALLBACK_PRICING: ModelPricing = { input: 3, output: 15 }; // Sonnet-level

const getPricing = (model: string): ModelPricing => {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Try prefix match (e.g. "claude-opus-4-6-20250601" → "claude-opus-4-6")
  for (const key of Object.keys(MODEL_PRICING).sort(
    (a, b) => b.length - a.length,
  )) {
    if (model.startsWith(key)) return MODEL_PRICING[key];
  }

  // Try keyword match
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return MODEL_PRICING["claude-opus-4-6"];
  if (lower.includes("haiku")) return MODEL_PRICING["claude-haiku-4-5"];
  if (lower.includes("sonnet")) return MODEL_PRICING["claude-sonnet-4-6"];

  return FALLBACK_PRICING;
};

const calculateThreadCost = (turns: ProcessedTurn[]): number => {
  let totalCost = 0;

  for (const turn of turns) {
    if (!turn.metadata?.usage) continue;

    const pricing = getPricing(turn.metadata.model ?? "");
    const { input_tokens, output_tokens } = turn.metadata.usage;
    const cachedInputTokens = Math.min(
      turn.metadata.usage.cached_input_tokens ?? 0,
      input_tokens,
    );
    const uncachedInputTokens = input_tokens - cachedInputTokens;

    totalCost +=
      (uncachedInputTokens * pricing.input +
        cachedInputTokens * (pricing.cachedInput ?? pricing.input) +
        output_tokens * pricing.output) /
      1_000_000;
  }

  return totalCost;
};

const formatCost = (cost: number): string => {
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
};

export { calculateThreadCost, formatCost, MODEL_PRICING };
