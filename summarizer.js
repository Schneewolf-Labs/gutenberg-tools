/**
 * summarizer.js
 *
 * Generates summaries for book chapters using an LLM.
 * This script processes each chapter through an OpenAI-compatible API
 * to create concise, plot-focused summaries that avoid essay-style language.
 *
 * Input: JSON file with chapters in 'chosen' field
 * Output: JSON file with added 'summary' field for each chapter
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
 * Checks if the generated summary contains any banned phrases or book title
 * @param {string} text - The summary text to check
 * @param {string} bookTitle - The title of the book to check for
 * @returns {boolean} True if banned content is detected
 */
export function hasBannedContent(text, bookTitle) {
  const testText = text.toLowerCase();

  // Check for common writing errors (meta-commentary)
  const hasBannedPhrase = config.summarizer.bannedOutput.some((banned) =>
    testText.includes(banned)
  );

  // Check if the book title is mentioned
  const hasBookTitle = testText.includes(`"${bookTitle}"`);

  return hasBannedPhrase || hasBookTitle;
}

/**
 * Generates a summary for a single chapter with retry logic
 * @param {string} chapter - The chapter text to summarize
 * @param {string} bookTitle - The title of the book
 * @param {Object} client - OpenAI client (for testing)
 * @returns {Promise<Object>} Object containing summary and token usage
 */
export async function generateSummary(chapter, bookTitle, client = openai) {
  let retries = 0;
  const maxRetries = config.processing.maxRetries;

  while (retries < maxRetries) {
    try {
      // Call the LLM to generate a summary
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: config.summarizer.systemPrompt },
          { role: 'user', content: chapter },
        ],
        ...(config.api.model && { model: config.api.model }),
      });

      const summary = response.choices[0].message.content;

      // Validate the output doesn't contain banned phrases or book title
      if (hasBannedContent(summary, bookTitle)) {
        console.warn('  ! Banned output detected, retrying...');
        retries++;
        continue;
      }

      return {
        summary,
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
  const inputFile = process.argv[2] || config.files.delined;
  const outputFile = process.argv[3] || config.files.summaries;

  console.log(`Reading from: ${inputFile}`);
  console.log(`Writing to: ${outputFile}`);

  // Load the JSON data
  const text = fs.readFileSync(inputFile, 'utf8');
  const json = JSON.parse(text);

  const n = json.length;
  console.log(`Loaded ${n} chapters to summarize.\n`);

  // Process each chapter
  for (let i = 0; i < n; i++) {
    console.log(`[${i + 1}/${n}] Processing chapter ${i + 1}...`);

    const entry = json[i];
    const book = entry.book;
    const chapter = entry.chosen;

    try {
      // Generate summary
      const result = await generateSummary(chapter, book);

      // Store the summary in the entry
      json[i].summary = result.summary;

      console.log(`  Summary: ${result.summary.substring(0, 100)}...`);
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
