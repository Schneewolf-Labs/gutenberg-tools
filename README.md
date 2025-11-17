# gutenberg-tools

A collection of scripts used to make the [gutenberg2-dpo](https://huggingface.co/datasets/nbeerbower/gutenberg2-dpo) dataset from Project Gutenberg books.

## Features

- Clean and normalize Project Gutenberg text
- Remove line breaks while preserving paragraph structure
- Generate chapter summaries using an LLM
- Create writing prompts for each chapter
- Generate rejected responses for DPO training
- Unified pipeline script with flexible options
- Comprehensive configuration system
- Detailed code comments and documentation

## Installation

```bash
npm install
```

## Configuration

All scripts use the centralized configuration file `config.js`. You can customize:

- **API Settings**: Base URL, API key, model selection
- **File Paths**: Input/output file paths for each stage
- **Processing Options**: Retry limits, delays, etc.
- **Prompts**: System prompts for each LLM task
- **Validation**: Banned phrases and output filters

Edit `config.js` to match your setup. For local LLM servers (like text-generation-webui), set:

```javascript
api: {
  baseURL: 'http://127.0.0.1:5001/v1',
  apiKey: '',  // Empty for local servers
}
```

## Quick Start

### Using the Pipeline Script (Recommended)

Run the complete pipeline with a single command:

```bash
# Run all stages
npm start -- --input input.json

# Or directly
node pipeline.js --input input.json
```

The pipeline will:
1. Clean the Gutenberg text
2. Remove line breaks
3. Generate summaries
4. Generate prompts
5. Generate rejected responses

Output will be saved to `final.json` (configurable in `config.js`).

### Pipeline Options

```bash
# Start from a specific stage
node pipeline.js --start summarizer

# Stop after a specific stage
node pipeline.js --stop deliner

# Skip certain stages
node pipeline.js --skip clean,deliner

# Show help
node pipeline.js --help
```

## Manual Script Usage

You can also run individual scripts for more control:

### 1. clean-text.js

Cleans and normalizes Gutenberg text (removes special formatting, normalizes quotes/dashes).

```bash
node clean-text.js input.json cleaned.json
```

### 2. deliner.js

Removes line breaks from text while preserving paragraph breaks.

```bash
node deliner.js cleaned.json delined.json
# Or use defaults from config.js
node deliner.js
```

### 3. summarizer.js

Generates summaries for each chapter using an LLM.

```bash
node summarizer.js delined.json summaries.json
# Or use defaults
node summarizer.js
```

### 4. prompter.js

Generates writing prompts for each chapter based on content and previous summaries.

```bash
node prompter.js summaries.json prompts.json
# Or use defaults
node prompter.js
```

### 5. rejecter.js

Generates rejected responses (alternative chapter versions) for DPO training.

```bash
node rejecter.js prompts.json final.json
# Or use defaults
node rejecter.js
```

## Input Data Format

Input JSON should be an array of objects with this structure:

```json
[
  {
    "book": "Book Title",
    "chapter": 1,
    "chosen": "Chapter text here..."
  },
  {
    "book": "Book Title",
    "chapter": 2,
    "chosen": "Chapter text here..."
  }
]
```

## Output Data Format

The final output (`final.json`) will have this structure:

```json
[
  {
    "book": "Book Title",
    "chapter": 1,
    "chosen": "Original chapter text (cleaned and processed)",
    "summary": "Summary of the chapter",
    "prompt": "Writing prompt for this chapter",
    "rejected": "Alternative version of the chapter"
  }
]
```

## LLM Server Setup

These scripts work with any OpenAI-compatible API. For local inference, we recommend:

- [text-generation-webui](https://github.com/oobabooga/text-generation-webui) with the `openai` extension
- [vLLM](https://github.com/vllm-project/vllm)
- [LM Studio](https://lmstudio.ai/)

Configure the `baseURL` in `config.js` to point to your server.

## Project Structure

```
gutenberg-tools/
├── config.js           # Centralized configuration
├── package.json        # NPM dependencies and scripts
├── pipeline.js         # Unified entrypoint script
├── clean-text.js       # Stage 1: Clean Gutenberg text
├── deliner.js          # Stage 2: Remove line breaks
├── summarizer.js       # Stage 3: Generate summaries
├── prompter.js         # Stage 4: Generate prompts
└── rejecter.js         # Stage 5: Generate rejected responses
```

## NPM Scripts

```bash
npm start              # Run the full pipeline
npm run clean          # Run clean-text.js only
npm run deliner        # Run deliner.js only
npm run summarize      # Run summarizer.js only
npm run prompt         # Run prompter.js only
npm run reject         # Run rejecter.js only
```

## Error Handling

All scripts include:
- Automatic retry logic for LLM API failures
- Output validation (banned phrases, format checking)
- Progress tracking and logging
- Graceful error messages

## TODO

- [ ] Script(s) to parse and clean chapters from Project Gutenberg text files automatically (currently requires manual processing with tools like [chapterize](https://github.com/JonathanReeve/chapterize))
- [ ] An agent capable of automatically scraping Project Gutenberg for new books and running the pipeline

## Contributing

When contributing, please ensure:
- All code includes JSDoc comments
- Configuration changes are documented
- Scripts maintain compatibility with the pipeline

## License

MIT
