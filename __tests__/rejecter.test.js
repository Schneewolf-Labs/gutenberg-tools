/**
 * Unit tests for rejecter.js
 */

import { generateRejected } from '../rejecter.js';
import config from '../config.js';

describe('generateRejected', () => {
  test('should generate rejected response successfully', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'This is an alternative version of the chapter.'
                }
              }
            ],
            usage: {
              total_tokens: 100
            }
          })
        }
      }
    };

    const prompt = 'Write a chapter about a hero on a quest.';
    const result = await generateRejected(prompt, mockClient);

    expect(result.rejected).toBe('This is an alternative version of the chapter.');
    expect(result.tokens).toBe(100);
    expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  test('should use correct system prompt', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Rejected text' } }],
            usage: { total_tokens: 50 }
          })
        }
      }
    };

    const prompt = 'Write a chapter.';
    await generateRejected(prompt, mockClient);

    const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[0].content).toBe(config.rejecter.systemPrompt);
    expect(callArgs.messages[1].role).toBe('user');
    expect(callArgs.messages[1].content).toBe(prompt);
  });

  test('should retry on API error', async () => {
    let callCount = 0;
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('Temporary API error');
            }
            return {
              choices: [{ message: { content: 'Success on retry' } }],
              usage: { total_tokens: 50 }
            };
          })
        }
      }
    };

    const result = await generateRejected('Prompt', mockClient);

    expect(result.rejected).toBe('Success on retry');
    expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  test('should throw error after max retries', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('Persistent API error'))
        }
      }
    };

    await expect(
      generateRejected('Prompt', mockClient)
    ).rejects.toThrow('Failed after');
  });

  test('should handle various prompt formats', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Generated text' } }],
            usage: { total_tokens: 50 }
          })
        }
      }
    };

    const prompts = [
      'Simple prompt',
      'Write a chapter with dialog and action.',
      'Summary of previous chapter: ...\n\nWrite the next chapter...'
    ];

    for (const prompt of prompts) {
      mockClient.chat.completions.create.mockClear();
      const result = await generateRejected(prompt, mockClient);

      expect(result.rejected).toBe('Generated text');
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[1].content).toBe(prompt);
    }
  });

  test('should handle empty prompt gracefully', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Response to empty prompt' } }],
            usage: { total_tokens: 10 }
          })
        }
      }
    };

    const result = await generateRejected('', mockClient);

    expect(result.rejected).toBe('Response to empty prompt');
    expect(result.tokens).toBe(10);
  });
});
