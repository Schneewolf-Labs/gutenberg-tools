/**
 * Unit tests for prompter.js
 */

import {
  buildSystemPrompt,
  buildUserInput,
  generatePrompt
} from '../prompter.js';
import config from '../config.js';

describe('buildSystemPrompt', () => {
  test('should build prompt for first chapter', () => {
    const result = buildSystemPrompt('Test Novel', true);

    expect(result).toContain('Test Novel');
    expect(result).toContain('opening chapter');
    expect(result).toContain('Write the opening chapter of a novel');
  });

  test('should build prompt for subsequent chapter', () => {
    const result = buildSystemPrompt('Test Novel', false);

    expect(result).toContain('Test Novel');
    expect(result).toContain('summary of the previous chapter');
    expect(result).toContain('Write the next chapter of a novel');
  });

  test('should include main instruction', () => {
    const result = buildSystemPrompt('Test Novel', true);
    expect(result).toContain(config.prompter.mainInstruction);
  });
});

describe('buildUserInput', () => {
  test('should return chapter text only for first chapter', () => {
    const chapter = 'Chapter text here.';
    const result = buildUserInput(chapter, null);

    expect(result).toBe(chapter);
  });

  test('should include previous summary for subsequent chapters', () => {
    const chapter = 'Chapter text here.';
    const previousSummary = 'Previous chapter summary.';
    const result = buildUserInput(chapter, previousSummary);

    expect(result).toContain('Summary of previous chapter:');
    expect(result).toContain(previousSummary);
    expect(result).toContain('Next chapter:');
    expect(result).toContain(chapter);
  });

  test('should format input correctly with both parts', () => {
    const result = buildUserInput('New chapter', 'Old summary');

    expect(result).toMatch(/Summary of previous chapter:\nOld summary\n\nNext chapter:\nNew chapter/);
  });
});

describe('generatePrompt', () => {
  test('should generate prompt successfully for first chapter', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Write the opening chapter of a novel about a hero.'
                }
              }
            ],
            usage: {
              total_tokens: 60
            }
          })
        }
      }
    };

    const result = await generatePrompt(
      'Chapter text...',
      'Test Novel',
      true,
      null,
      mockClient
    );

    expect(result.prompt).toBe('Write the opening chapter of a novel about a hero.');
    expect(result.tokens).toBe(60);
  });

  test('should generate prompt for subsequent chapter with previous summary', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Write the next chapter of a novel continuing the story.'
                }
              }
            ],
            usage: {
              total_tokens: 70
            }
          })
        }
      }
    };

    const result = await generatePrompt(
      'Chapter text...',
      'Test Novel',
      false,
      'Previous summary',
      mockClient
    );

    expect(result.prompt).toContain('Write the next chapter');
    expect(result.tokens).toBe(70);

    // Verify the API was called with the summary
    const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain('Summary of previous chapter:');
    expect(callArgs.messages[1].content).toContain('Previous summary');
  });

  test('should retry if output does not start with "Write"', async () => {
    let callCount = 0;
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              return {
                choices: [
                  {
                    message: {
                      content: 'This is an invalid response.'
                    }
                  }
                ],
                usage: { total_tokens: 50 }
              };
            } else {
              return {
                choices: [
                  {
                    message: {
                      content: 'Write the opening chapter of a novel.'
                    }
                  }
                ],
                usage: { total_tokens: 60 }
              };
            }
          })
        }
      }
    };

    const result = await generatePrompt(
      'Chapter text',
      'Test Novel',
      true,
      null,
      mockClient
    );

    expect(result.prompt).toBe('Write the opening chapter of a novel.');
    expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  test('should throw error after max retries', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    };

    await expect(
      generatePrompt('Chapter', 'Book', true, null, mockClient)
    ).rejects.toThrow('Failed after');
  });

  test('should use correct system prompt based on chapter position', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Write a chapter...' } }],
            usage: { total_tokens: 50 }
          })
        }
      }
    };

    // First chapter
    await generatePrompt('Text', 'Novel', true, null, mockClient);
    let callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('opening chapter');

    // Subsequent chapter
    mockClient.chat.completions.create.mockClear();
    await generatePrompt('Text', 'Novel', false, 'Summary', mockClient);
    callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('summary of the previous chapter');
  });
});
