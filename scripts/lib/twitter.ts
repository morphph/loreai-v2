// scripts/lib/twitter.ts — Twitter API client
// Implemented in Batch 2
import 'dotenv/config';

export const TWITTER_ACCOUNTS = [
  // Claude Code Team
  'bcherny', 'ErikSchluntz', 'adocomplete', 'felixrieseberg',
  // Anthropic
  'AnthropicAI', 'claudeai', 'mikeyk', 'alexalbert__', 'trq212',
  // Official Labs
  'OpenAI', 'OpenAIDevs', 'GoogleAI', 'GoogleDeepMind', 'AIatMeta',
  'MistralAI', 'huggingface', 'LangChainAI',
  // Thought Leaders
  'karpathy', 'swyx', 'lilianweng', 'simonw', 'emollick', 'drjimfan',
  'latentspacepod', 'aiDotEngineer', 'sama',
  // Broader Coverage
  'hardmaru', '_akhaliq', 'reach_vb', 'AiBreakfast',
  // More
  'ylecun', 'ID_AA_Carmack', 'bindureddy',
  // From AI Dev
  'chipro', 'ChatGPTapp',
];

export const SEARCH_QUERIES = [
  'Claude Code', 'AI agent', 'AI agent framework', 'MCP server',
  'Claude Code skills', 'vibe coding', 'AI devtools', 'LLM tools',
  'AI engineering', 'open source LLM', 'AI startup funding',
  'OpenAI Responses API', 'Claude API', 'OpenAI skills',
];

// TODO: Implement in Batch 2
export async function fetchTwitterTimelines(): Promise<unknown[]> {
  console.log('twitter.ts: fetchTwitterTimelines not yet implemented');
  return [];
}

export async function fetchTwitterSearches(): Promise<unknown[]> {
  console.log('twitter.ts: fetchTwitterSearches not yet implemented');
  return [];
}
