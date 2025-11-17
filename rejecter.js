/**
 * rejecter.js
 *
 * Generates "rejected" responses for each chapter using an LLM.
 * This script creates alternative chapter versions based on the prompts,
 * which can be used as negative examples in DPO (Direct Preference Optimization) training.
 *
 * Input: JSON file with chapters and prompts
 * Output: JSON file with added 'rejected' field for each chapter
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
 * Generates a rejected response for a single chapter with retry logic
 * @param {string} prompt - The writing prompt for the chapter
 * @returns {Promise<Object>} Object containing the rejected text and token usage
 */
async function generateRejected(prompt) {
  let retries = 0;
  const maxRetries = config.processing.maxRetries;

  while (retries < maxRetries) {
    try {
      // Call the LLM to generate an alternative chapter
      const response = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: config.rejecter.systemPrompt },
          { role: 'user', content: prompt },
        ],
        ...(config.api.model && { model: config.api.model }),
      });

      const output = response.choices[0].message.content;

      return {
        rejected: output,
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
  const inputFile = process.argv[2] || config.files.prompts;
  const outputFile = process.argv[3] || config.files.final;

  console.log(`Reading from: ${inputFile}`);
  console.log(`Writing to: ${outputFile}`);

  // Load the JSON data
  const text = fs.readFileSync(inputFile, 'utf8');
  const json = JSON.parse(text);

  const n = json.length;
  console.log(`Loaded ${n} chapters to generate rejected responses for.\n`);

  // Process each chapter
  for (let i = 0; i < n; i++) {
    console.log(`[${i + 1}/${n}] Processing chapter ${i + 1}...`);

    const entry = json[i];
    const prompt = entry.prompt;

    try {
      // Generate the rejected response
      const result = await generateRejected(prompt);

      // Store the rejected response
      json[i].rejected = result.rejected;

      console.log(`  Rejected: ${result.rejected.substring(0, 100)}...`);
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

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
