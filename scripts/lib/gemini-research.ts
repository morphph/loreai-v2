/**
 * Gemini Deep Research — TypeScript wrapper
 *
 * Calls scripts/gemini-research-worker.py via execSync (Python fallback).
 * The JS SDK (@google/genai) does not support the Interactions API,
 * so we delegate to Python which has full support.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const WORKER_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'gemini-research-worker.py');

/**
 * Run Gemini Deep Research for a topic.
 * Writes output to outputPath. Returns true on success, false on failure.
 * On failure, writes a minimal fallback file so the pipeline can continue.
 */
export async function runGeminiDeepResearch(
  topic: string,
  outputPath: string
): Promise<boolean> {
  console.log(`[RESEARCH] Starting Gemini Deep Research for: ${topic}`);
  console.log(`[RESEARCH] This may take 10-20 minutes...`);

  try {
    execSync(`python3 "${WORKER_SCRIPT}"`, {
      cwd: PROJECT_ROOT,
      timeout: 25 * 60 * 1000, // 25 minutes (research can take up to 20 min)
      encoding: 'utf-8',
      stdio: 'inherit',
      env: {
        ...process.env,
        RESEARCH_TOPIC: topic,
        OUTPUT_PATH: outputPath,
      },
    });

    if (existsSync(outputPath)) {
      console.log(`[RESEARCH] Success: ${outputPath}`);
      return true;
    }

    console.warn(`[RESEARCH] Python exited 0 but output file not found`);
  } catch (err: any) {
    console.warn(`[RESEARCH] Gemini research failed: ${err.message}`);
  }

  // Fallback: write minimal context so writers can still produce content
  console.log(`[RESEARCH] Writing fallback material...`);
  writeFileSync(outputPath, `Topic: ${topic}\nGemini research failed. Write based on your knowledge of this topic.\n`);
  return false;
}
