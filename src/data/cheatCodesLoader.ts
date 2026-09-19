import { CheatCodePrompt, CollectionTierId } from '../types';

// Statically import the uploaded Android cheatcodes json files
import chatgptBasic from '../assets/cheatcodes/chatgpt_basic.json';
import chatgptAdvanced from '../assets/cheatcodes/chatgpt_advanced.json';
import chatgptExpert from '../assets/cheatcodes/chatgpt_expert.json';
import chatgptMaster from '../assets/cheatcodes/chatgpt_master.json';
import chatgptUltimate from '../assets/cheatcodes/chatgpt_ultimate.json';

// Claude JSON files
import claudeBasic from '../assets/cheatcodes/claude_basic.json';
import claudeAdvanced from '../assets/cheatcodes/claude_advanced.json';
import claudeExpert from '../assets/cheatcodes/claude_expert.json';
import claudeMaster from '../assets/cheatcodes/claude_master.json';
import claudeUltimate from '../assets/cheatcodes/claude_ultimate.json';

// Gemini JSON files
import geminiBasic from '../assets/cheatcodes/gemini_basic.json';
import geminiAdvanced from '../assets/cheatcodes/gemini_advanced.json';
import geminiExpert from '../assets/cheatcodes/gemini_expert.json';
import geminiMaster from '../assets/cheatcodes/gemini_master.json';
import geminiUltimate from '../assets/cheatcodes/gemini_ultimate.json';

const CHATGPT_DATA: Record<CollectionTierId, CheatCodePrompt[]> = {
  basic: chatgptBasic as CheatCodePrompt[],
  advanced: chatgptAdvanced as CheatCodePrompt[],
  expert: chatgptExpert as CheatCodePrompt[],
  master: chatgptMaster as CheatCodePrompt[],
  ultimate: chatgptUltimate as CheatCodePrompt[],
};

const CLAUDE_DATA: Record<CollectionTierId, CheatCodePrompt[]> = {
  basic: claudeBasic as CheatCodePrompt[],
  advanced: claudeAdvanced as CheatCodePrompt[],
  expert: claudeExpert as CheatCodePrompt[],
  master: claudeMaster as CheatCodePrompt[],
  ultimate: claudeUltimate as CheatCodePrompt[],
};

const GEMINI_DATA: Record<CollectionTierId, CheatCodePrompt[]> = {
  basic: geminiBasic as CheatCodePrompt[],
  advanced: geminiAdvanced as CheatCodePrompt[],
  expert: geminiExpert as CheatCodePrompt[],
  master: geminiMaster as CheatCodePrompt[],
  ultimate: geminiUltimate as CheatCodePrompt[],
};

/**
 * Loads cheat code prompts for any model and collection tier.
 * Matches original Android filenames (e.g., chatgpt_basic.json, claude_basic.json, gemini_basic.json, etc.).
 */
export function getCheatCodes(modelId: string, tierId: CollectionTierId): CheatCodePrompt[] {
  const normalizedModel = modelId.toLowerCase();
  
  if (normalizedModel === 'chatgpt' || normalizedModel === 'chatgpt-4o') {
    return CHATGPT_DATA[tierId] || [];
  }

  if (normalizedModel === 'claude' || normalizedModel === 'anthropic' || normalizedModel === 'claude-3') {
    return CLAUDE_DATA[tierId] || [];
  }

  if (normalizedModel === 'gemini' || normalizedModel === 'google' || normalizedModel === 'gemini-1.5' || normalizedModel === 'gemini-pro') {
    return GEMINI_DATA[tierId] || [];
  }
  
  // Return empty array for models whose JSONs have not been uploaded yet
  return [];
}
