/**
 * prompter.js
 *
 * Generates writing prompts for each chapter using an LLM.
 * This script creates prompts that could be used to recreate each chapter,
 * incorporating context from previous chapter summaries for continuity.
 *
 * Input: JSON file with chapters and summaries
 * Output: JSON file with added 'prompt' field for each chapter
 */

import OpenAI from 'openai';
import fs from 'fs';
import config from './config.js';

// Initialize OpenAI client with configured endpoint
const openai = new OpenAI({
  baseURL: config.api.baseURL,
  apiKey: config.api.apiKey,
});

/**
 * Builds the system prompt for generating a chapter writing prompt
 * @param {string} book - The title of the book
 * @param {boolean} isFirst - Whether this is the first chapter
 * @returns {string} The system prompt
 */
export function buildSystemPrompt(book, isFirst) {
  const opener = isFirst
    ? config.prompter.systemOpenerFirst(book)
    : config.prompter.systemOpenerNext(book);

  const closer = isFirst
    ? config.prompter.systemCloserFirst
    : config.prompter.systemCloserNext;

  return `${opener} ${config.prompter.mainInstruction} ${closer}`;
}

/**
 * Builds the user input combining chapter text with previous summary if applicable
 * @param {string} chapter - The chapter text
 * @param {string|null} previousSummary - Summary of the previous chapter (null for first chapter)
 * @returns {string} The user input for the LLM
 */
export function buildUserInput(chapter, previousSummary) {
  if (!previousSummary) {
    return chapter;
  }

  return `Summary of previous chapter:\n${previousSummary}\n\nNext chapter:\n${chapter}`;
}

/**
 * Generates a writing prompt for a single chapter with retry logic
 * @param {string} chapter - The chapter text
 * @param {string} book - The title of the book
 * @param {boolean} isFirst - Whether this is the first chapter
 * @param {string|null} previousSummary - Summary of previous chapter
 * @param {Object} client - OpenAI client (for testing)
 * @returns {Promise<Object>} Object containing the prompt and token usage
 */
export async function generatePrompt(chapter, book, isFirst, previousSummary, client = openai) {
  let retries = 0;
  const maxRetries = config.processing.maxRetries;
  let userInput = buildUserInput(chapter, previousSummary);
  const systemPrompt = buildSystemPrompt(book, isFirst);

  while (retries < maxRetries) {
    try {
      // Call the LLM to generate a writing prompt
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
        ...(config.api.model && { model: config.api.model }),
      });

      const output = response.choices[0].message.content;
      const testText = output.toLowerCase();

      // Validate that the output starts with "Write" as expected
      if (!testText.startsWith('write')) {
        console.warn('  ! Output does not start with "Write", retrying...');
        // Add additional instruction to guide the model
        userInput += '\n Respond with a prompt that starts with "Write a chapter of a novel ".';
        retries++;
        continue;
      }

      return {
        prompt: output,
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      console.error(`  ! Error encountered: ${error.message}`);
      retries++;

      if (retries >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, config.processing.retryDelay)
      );
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  // Determine input and output file paths
  const inputFile = process.argv[2] || config.files.summaries;
  const outputFile = process.argv[3] || config.files.prompts;

  console.log(`Reading from: ${inputFile}`);
  console.log(`Writing to: ${outputFile}`);

  // Load the JSON data
  const text = fs.readFileSync(inputFile, 'utf8');
  const json = JSON.parse(text);

  const n = json.length;
  console.log(`Loaded ${n} chapters to generate prompts for.\n`);

  // Process each chapter
  for (let i = 0; i < n; i++) {
    console.log(`[${i + 1}/${n}] Processing chapter ${i + 1}...`);

    const entry = json[i];
    const book = entry.book;
    const chapter = entry.chosen.trim();
    const chapIdx = entry.chapter;
    const isFirst = chapIdx == 1;

    // Get previous chapter's summary if this isn't the first chapter
    const previousSummary = isFirst ? null : json[i - 1].summary.trim();

    try {
      // Generate the writing prompt
      const result = await generatePrompt(chapter, book, isFirst, previousSummary);

      // Build the final prompt with previous summary if applicable
      const summaryPrefix = isFirst
        ? ''
        : `Summary of the previous chapter: ${previousSummary}\n\n`;

      json[i].prompt = `${summaryPrefix}${result.prompt}`;

      console.log(`  Prompt: ${result.prompt.substring(0, 100)}...`);
      console.log(`  Tokens used: ${result.tokens}\n`);
    } catch (error) {
      console.error(`  Failed to process chapter ${i + 1}: ${error.message}`);
      process.exit(1);
    }
  }

  // Save the results
  fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));

  console.log(`Successfully processed ${n} chapters`);
  console.log(`Output saved to: ${outputFile}`);
}

// Run the main function only if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
