/**
 * Unit tests for summarizer.js
 */

import { hasBannedContent, generateSummary } from '../summarizer.js';
import config from '../config.js';

describe('hasBannedContent', () => {
  test('should detect banned phrases', () => {
    const text = 'In this passage, the hero goes on an adventure.';
    const bookTitle = 'Test Book';
    expect(hasBannedContent(text, bookTitle)).toBe(true);
  });

  test('should detect book title mention', () => {
    const text = 'This is about "Test Book" and its characters.';
    const bookTitle = 'Test Book';
    expect(hasBannedContent(text, bookTitle)).toBe(true);
  });

  test('should pass clean summary', () => {
    const text = 'The hero embarks on a journey to find the lost treasure.';
    const bookTitle = 'Test Book';
    expect(hasBannedContent(text, bookTitle)).toBe(false);
  });

  test('should be case insensitive for banned phrases', () => {
    const text = 'OVERALL, this was a good chapter.';
    const bookTitle = 'Test Book';
    expect(hasBannedContent(text, bookTitle)).toBe(true);
  });

  test('should detect multiple banned phrases', () => {
    expect(hasBannedContent('In conclusion, this chapter...', 'Book')).toBe(true);
    expect(hasBannedContent('This story is about...', 'Book')).toBe(true);
    expect(hasBannedContent('The story continues...', 'Book')).toBe(true);
  });
});

describe('generateSummary', () => {
  test('should generate a summary successfully', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'The hero embarks on a journey to find treasure.'
                }
              }
            ],
            usage: {
              total_tokens: 50
            }
          })
        }
      }
    };

    const result = await generateSummary(
      'Chapter text here...',
      'Test Book',
      mockClient
    );

    expect(result.summary).toBe('The hero embarks on a journey to find treasure.');
    expect(result.tokens).toBe(50);
    expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  test('should retry on banned content detection', async () => {
    let callCount = 0;
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              // First call returns banned content
              return {
                choices: [
                  {
                    message: {
                      content: 'In this passage, the hero goes on an adventure.'
                    }
                  }
                ],
                usage: { total_tokens: 50 }
              };
            } else {
              // Second call returns clean content
              return {
                choices: [
                  {
                    message: {
                      content: 'The hero goes on an adventure.'
                    }
                  }
                ],
                usage: { total_tokens: 45 }
              };
            }
          })
        }
      }
    };

    const result = await generateSummary(
      'Chapter text here...',
      'Test Book',
      mockClient
    );

    expect(result.summary).toBe('The hero goes on an adventure.');
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
      generateSummary('Chapter text', 'Test Book', mockClient)
    ).rejects.toThrow('Failed after');
  });

  test('should include system prompt in API call', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Summary here.' } }],
            usage: { total_tokens: 50 }
          })
        }
      }
    };

    await generateSummary('Chapter text', 'Test Book', mockClient);

    const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[0].content).toBe(config.summarizer.systemPrompt);
    expect(callArgs.messages[1].role).toBe('user');
    expect(callArgs.messages[1].content).toBe('Chapter text');
  });
});
