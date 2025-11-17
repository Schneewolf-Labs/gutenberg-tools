#!/usr/bin/env node

/**
 * pipeline.js
 *
 * Unified entrypoint script for the gutenberg-tools pipeline.
 * This script runs all processing steps in order to transform raw
 * Project Gutenberg text into a DPO (Direct Preference Optimization) dataset.
 *
 * Pipeline stages:
 * 1. clean-text.js - Clean and normalize Gutenberg text
 * 2. deliner.js - Remove line breaks from text
 * 3. summarizer.js - Generate chapter summaries
 * 4. prompter.js - Generate writing prompts
 * 5. rejecter.js - Generate rejected responses
 *
 * Usage:
 *   node pipeline.js [options]
 *
 * Options:
 *   --input <file>    Input JSON file (default: input.json)
 *   --start <stage>   Start from specific stage (clean, deliner, summarizer, prompter, rejecter)
 *   --stop <stage>    Stop after specific stage
 *   --skip <stages>   Comma-separated list of stages to skip
 *   --help            Show this help message
 */

import { spawn } from 'child_process';
import fs from 'fs';
import config from './config.js';

// Define the pipeline stages
const STAGES = [
  {
    name: 'clean',
    script: 'clean-text.js',
    input: (inputFile) => inputFile,
    output: config.files.cleaned,
    description: 'Cleaning and normalizing Gutenberg text',
  },
  {
    name: 'deliner',
    script: 'deliner.js',
    input: config.files.cleaned,
    output: config.files.delined,
    description: 'Removing line breaks from text',
  },
  {
    name: 'summarizer',
    script: 'summarizer.js',
    input: config.files.delined,
    output: config.files.summaries,
    description: 'Generating chapter summaries',
  },
  {
    name: 'prompter',
    script: 'prompter.js',
    input: config.files.summaries,
    output: config.files.prompts,
    description: 'Generating writing prompts',
  },
  {
    name: 'rejecter',
    script: 'rejecter.js',
    input: config.files.prompts,
    output: config.files.final,
    description: 'Generating rejected responses',
  },
];

/**
 * Parse command line arguments
 * @returns {Object} Parsed options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: config.files.input,
    start: null,
    stop: null,
    skip: [],
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--start':
        options.start = args[++i];
        break;
      case '--stop':
        options.stop = args[++i];
        break;
      case '--skip':
        options.skip = args[++i].split(',').map((s) => s.trim());
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
    }
  }

  return options;
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
gutenberg-tools Pipeline
========================

Processes Project Gutenberg text into a DPO dataset through multiple stages.

Usage:
  node pipeline.js [options]

Options:
  --input <file>    Input JSON file (default: ${config.files.input})
  --start <stage>   Start from specific stage (${STAGES.map((s) => s.name).join(', ')})
  --stop <stage>    Stop after specific stage
  --skip <stages>   Comma-separated list of stages to skip
  --help, -h        Show this help message

Stages:
${STAGES.map((s, i) => `  ${i + 1}. ${s.name.padEnd(12)} - ${s.description}`).join('\n')}

Examples:
  # Run the full pipeline
  node pipeline.js --input my-book.json

  # Start from summarizer stage
  node pipeline.js --start summarizer

  # Run only clean and deliner stages
  node pipeline.js --stop deliner

  # Skip the clean stage (if already cleaned)
  node pipeline.js --skip clean
`);
}

/**
 * Run a script with given arguments
 * @param {string} script - Script filename
 * @param {Array<string>} args - Command line arguments
 * @returns {Promise<void>}
 */
function runScript(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${script} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main pipeline execution
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('='.repeat(60));
  console.log('gutenberg-tools Pipeline');
  console.log('='.repeat(60));
  console.log(`Input file: ${options.input}`);
  console.log(`Output file: ${config.files.final}`);

  // Validate input file exists
  if (!fs.existsSync(options.input)) {
    console.error(`\nError: Input file '${options.input}' not found.`);
    process.exit(1);
  }

  // Determine which stages to run
  let startIndex = 0;
  let stopIndex = STAGES.length - 1;

  if (options.start) {
    startIndex = STAGES.findIndex((s) => s.name === options.start);
    if (startIndex === -1) {
      console.error(`Error: Unknown start stage '${options.start}'`);
      process.exit(1);
    }
  }

  if (options.stop) {
    stopIndex = STAGES.findIndex((s) => s.name === options.stop);
    if (stopIndex === -1) {
      console.error(`Error: Unknown stop stage '${options.stop}'`);
      process.exit(1);
    }
  }

  const stagesToRun = STAGES.slice(startIndex, stopIndex + 1).filter(
    (stage) => !options.skip.includes(stage.name)
  );

  console.log(`\nStages to run: ${stagesToRun.map((s) => s.name).join(' → ')}\n`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  // Run each stage
  for (let i = 0; i < stagesToRun.length; i++) {
    const stage = stagesToRun[i];
    const stageNum = startIndex + i + 1;

    console.log(`\n[Stage ${stageNum}/${STAGES.length}] ${stage.description}...`);
    console.log('-'.repeat(60));

    try {
      // Determine input file for this stage
      const inputFile =
        typeof stage.input === 'function'
          ? stage.input(options.input)
          : stage.input;

      // Check if input file exists (except for the first stage)
      if (i > 0 && !fs.existsSync(inputFile)) {
        console.error(`Error: Input file '${inputFile}' not found.`);
        console.error('Previous stage may have failed or been skipped.');
        process.exit(1);
      }

      // Run the stage
      await runScript(stage.script, [inputFile, stage.output]);

      console.log(`✓ Stage completed: ${stage.output}`);
    } catch (error) {
      console.error(`\n✗ Stage failed: ${error.message}`);
      process.exit(1);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log(`✓ Pipeline completed successfully in ${elapsed}s`);
  console.log(`Final output: ${config.files.final}`);
  console.log('='.repeat(60));
}

// Run the pipeline
main().catch((error) => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
