/**
 * clean-text.js
 *
 * Cleans and normalizes text from Project Gutenberg books.
 * This script removes special formatting, brackets, decorative elements,
 * normalizes quotes and dashes, and structures the text into clean paragraphs.
 *
 * Input: JSON file with array of objects containing 'chosen' field
 * Output: JSON file with cleaned text
 *
 * Usage: node clean-text.js <input.json> <output.json>
 */

import fs from 'fs';
import config from './config.js';

/**
 * Cleans and normalizes Project Gutenberg text
 * @param {string} text - The raw text to clean
 * @returns {string} Cleaned and normalized text
 */
export function cleanGutenbergText(text) {
  // Handle THE END marker and remove everything after it
  if (text.includes('THE END')) {
    text = text.split('THE END')[0].trim() + '\n\nTHE END';
  }

  // Character replacement map for Unicode characters common in Gutenberg texts
  const charMap = {
    '\u201C': '"', // left double quotation mark → standard quote
    '\u201D': '"', // right double quotation mark → standard quote
    '\u2033': '"', // double prime → standard quote
    '\u2018': "'", // left single quotation mark → apostrophe
    '\u2019': "'", // right single quotation mark → apostrophe
    '\u2032': "'", // prime → apostrophe
    '\u0060': "'", // backtick → apostrophe
    '\u201A': ',', // single low-9 quotation mark → comma
    '\u2014': '--', // em-dash → double hyphen
    '\u2013': '--', // en-dash → double hyphen
    '\u2015': '--', // horizontal bar → double hyphen
    '\u2012': '--', // figure dash → double hyphen
  };

  // Create a regex pattern from all the special characters
  const charPattern = new RegExp(`[${Object.keys(charMap).join('')}]`, 'g');

  return (
    text
      // Replace special Unicode characters with standard ASCII equivalents
      .replace(charPattern, (match) => charMap[match])

      // Normalize line endings to Unix format
      .replace(/\r\n/g, '\n')

      // Remove asterisk separator lines (like: * * * * *)
      .replace(/^\s*\*\s*\*\s*\*\s*\*\s*\*\s*$/gm, '')

      // Remove illustration tags and bracketed content [Illustration: ...]
      .replace(/\[.*?\]/g, '')

      // Remove decorative separator lines (dashes, underscores, etc.)
      .replace(/^[\s*_-]{3,}$/gm, '')

      // Clean up quotes: ensure no extra spaces inside quotes
      .replace(/"([^"]+)"/g, (match, p1) => `"${p1.trim()}"`)

      // Split into paragraphs and clean each one
      .split('\n\n')
      .map((paragraph) => {
        // For each paragraph, join wrapped lines and normalize spacing
        return paragraph
          .split('\n')
          .map((line) => line.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter((para) => para.length > 0)
      .join('\n\n')

      // Add paragraph breaks after dialog that's followed by narrative
      // Matches: [.!?]" followed by capital letter
      .replace(/([.!?]")(\s*)([A-Z])/g, '$1\n\n$3')

      // Final cleanup: remove any extra spaces
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/**
 * Main execution function
 */
function main() {
  // Check if input and output filenames were provided
  if (process.argv.length < 4) {
    console.log('Usage: node clean-text.js <input.json> <output.json>');
    console.log('Example: node clean-text.js input.json cleaned.json');
    process.exit(1);
  }

  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  try {
    console.log(`Reading from: ${inputFile}`);

    // Read and parse input JSON
    const text = fs.readFileSync(inputFile, 'utf8');
    const json = JSON.parse(text);

    console.log(`Processing ${json.length} entries...`);

    // Clean the text in the 'chosen' field of each entry
    json.forEach((row, index) => {
      row.chosen = cleanGutenbergText(row.chosen);

      // Remove rejected and prompt fields to ensure clean data
      delete row.rejected;
      delete row.prompt;

      // Log progress for large datasets
      if ((index + 1) % 10 === 0 || index === json.length - 1) {
        console.log(`  Processed ${index + 1}/${json.length} entries`);
      }
    });

    // Write output JSON with pretty formatting
    fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));

    console.log(`Successfully cleaned text and saved to ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function only if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
