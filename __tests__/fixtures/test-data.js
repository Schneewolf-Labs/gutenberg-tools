/**
 * Test fixtures for unit tests
 */

export const sampleChapter = {
  book: "Test Novel",
  chapter: 1,
  chosen: "This is a test chapter with some text. It has multiple sentences."
};

export const sampleChapters = [
  {
    book: "Test Novel",
    chapter: 1,
    chosen: "Chapter one text here. This is the first chapter."
  },
  {
    book: "Test Novel",
    chapter: 2,
    chosen: "Chapter two text here. This continues the story."
  }
];

export const gutenbergRawText = `"Curly quotes" and 'single quotes' are common.
Em—dashes and en–dashes appear frequently.

[Illustration: A picture]

* * * * *

Normal text continues here.`;

export const gutenbergCleanedText = `"Curly quotes" and 'single quotes' are common. Em--dashes and en--dashes appear frequently.

Normal text continues here.`;

export const textWithLineBreaks = `This is a paragraph
with line breaks
in the middle.

This is another
paragraph.`;

export const textWithoutLineBreaks = `This is a paragraph with line breaks in the middle.

This is another paragraph.`;

export const mockLLMResponse = {
  choices: [
    {
      message: {
        content: "This is a test response from the LLM."
      }
    }
  ],
  usage: {
    total_tokens: 50
  }
};

export const mockSummary = "This chapter introduces the main character and sets the scene in a small village.";

export const mockPrompt = "Write the opening chapter of a novel about a small village where a mysterious stranger arrives.";

export const mockRejected = "A different version of the chapter that is less well-written.";
