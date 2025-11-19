/**
 * Utility functions for testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a temporary test file
 * @param {string} filename - Name of the file
 * @param {Object} data - Data to write to the file
 * @returns {string} Path to the created file
 */
export function createTestFile(filename, data) {
  const filepath = path.join(__dirname, 'fixtures', filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

/**
 * Removes a test file
 * @param {string} filepath - Path to the file to remove
 */
export function removeTestFile(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Reads JSON from a file
 * @param {string} filepath - Path to the file
 * @returns {Object} Parsed JSON data
 */
export function readTestFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content);
}

/**
 * Creates a mock OpenAI client for testing
 * @param {Object} responses - Mock responses to return
 * @returns {Object} Mock OpenAI client
 */
export function createMockOpenAI(responses = []) {
  let callCount = 0;

  return {
    chat: {
      completions: {
        create: jest.fn(async () => {
          const response = responses[callCount] || responses[responses.length - 1];
          callCount++;
          return response;
        })
      }
    }
  };
}

/**
 * Cleanup function to remove all test fixture files
 */
export function cleanupTestFiles() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const files = fs.readdirSync(fixturesDir);

  files.forEach(file => {
    if (file.endsWith('.json') || file.endsWith('.tmp')) {
      const filepath = path.join(fixturesDir, file);
      fs.unlinkSync(filepath);
    }
  });
}
