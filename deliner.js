/**
 * deliner.js
 *
 * Removes line breaks from text while preserving paragraph breaks.
 * This script processes JSON data containing book chapters and converts
 * single line breaks into spaces, while maintaining paragraph structure.
 *
 * Input: JSON file with array of objects containing 'chosen' field
 * Output: JSON file with cleaned text (line breaks removed, extra fields deleted)
 */

import fs from 'fs';
import config from './config.js';

/**
 * Converts single line breaks to spaces while preserving paragraph breaks
 * @param {string} text - The text to process
 * @returns {string} Text with single line breaks converted to spaces
 */
export function convertLineBreaksToSpaces(text) {
  return text
    // Replace line breaks that are not part of paragraph breaks (double line breaks)
    // Uses negative lookbehind (?<!\n) and lookahead (?!\n) to match single \n only
    .replace(/(?<!\n)\n(?!\n)/g, ' ')
    // Remove any extra spaces that might have been created
    .replace(/\s+/g, ' ')
    // Trim leading and trailing whitespace
    .trim();
}

/**
 * Main execution
 */
function main() {
  // Determine input and output file paths
  const inputFile = process.argv[2] || config.files.cleaned || config.files.input;
  const outputFile = process.argv[3] || config.files.delined;

  console.log(`Reading from: ${inputFile}`);
  console.log(`Writing to: ${outputFile}`);

  // Load the JSON data from the input file
  const text = fs.readFileSync(inputFile, 'utf8');
  const json = JSON.parse(text);

  console.log(`Processing ${json.length} entries...`);

  // Process each entry in the JSON array
  json.forEach((row, index) => {
    // Convert line breaks to spaces in the 'chosen' field
    row.chosen = convertLineBreaksToSpaces(row.chosen);

    // Clean up any existing rejected/prompt fields to ensure clean data
    delete row.rejected;
    delete row.prompt;
  });

  // Save the processed data to the output file
  fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));

  console.log(`Successfully processed ${json.length} entries`);
  console.log(`Output saved to: ${outputFile}`);
}

// Run the main function only if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
