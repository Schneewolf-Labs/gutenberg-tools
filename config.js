/**
 * Configuration file for gutenberg-tools pipeline
 * This file contains all configurable parameters for the data processing scripts
 */

export default {
  // OpenAI-compatible API configuration
  api: {
    // Base URL for the API endpoint (e.g., local LLM server, OpenAI, etc.)
    baseURL: 'http://127.0.0.1:5001/v1',
    // API key (empty string if not required by local server)
    apiKey: '',
    // Model name to use (if your API supports model selection)
    model: undefined,
  },

  // File paths for the pipeline stages
  files: {
    // Input file containing raw Gutenberg chapters
    input: './input.json',
    // Output after cleaning text
    cleaned: './cleaned.json',
    // Output after removing line breaks
    delined: './delined.json',
    // Output after generating summaries
    summaries: './summaries.json',
    // Output after generating prompts
    prompts: './prompts.json',
    // Final output with rejected responses
    final: './final.json',
  },

  // Summarizer configuration
  summarizer: {
    // System prompt for the summarization task
    systemPrompt: `Read and then summarize the chapter of a novel provided by the user. Be descriptive, avoid essay language like "Overall," "In conclusion," "In this passage," etc. Simply summarize the plot and key points of the provided text. Do not talk about the book nor mention the title of the book or the author in your summary. Write only your summary in a single paragraph and no other text, headings, or lists.`,

    // List of banned phrases/words in the output (triggers retry)
    bannedOutput: [
      'in this passage',
      'in conclusion',
      'overall,',
      'this chapter',
      'this text',
      'this passage',
      'this excerpt',
      'this section',
      'this selection',
      'this story',
      'the story',
      'this novel',
      'this book',
      'this extract',
      '" by ',
      '<|endoftext|>',
      '<|im_start|>',
      '<|im_end|>',
      '###',
      '1.',
      '0:',
      '1:',
    ],
  },

  // Prompter configuration
  prompter: {
    // Template for opening chapter prompt generation
    systemOpenerFirst: (book) => `Read the opening chapter of ${book} provided by the user.`,
    // Template for subsequent chapter prompt generation
    systemOpenerNext: (book) => `Read the chapter and summary of the previous chapter of ${book} provided by the user.`,
    // Closing instruction for first chapter
    systemCloserFirst: 'Start your response with "Write the opening chapter of a novel "',
    // Closing instruction for subsequent chapters
    systemCloserNext: 'Start your response with "Write the next chapter of a novel ". ',
    // Main instruction
    mainInstruction: 'Then write a prompt for an LLM that would result in this chapter being written. Be descriptive, ask for specific details, and do not mention the title of the book or the author in the prompt.',
  },

  // Rejecter configuration
  rejecter: {
    // System prompt for generating rejected responses
    systemPrompt: `Given the following prompt, write a chapter of a novel. Do not mention the title of the book or the author in your response. Write as if you are continuing a story. Do not include the prompt or any other headings or instructions in your response.`,
  },

  // Processing options
  processing: {
    // Maximum number of retries for failed API calls
    maxRetries: 10,
    // Delay between retries in milliseconds
    retryDelay: 1000,
  },
};
