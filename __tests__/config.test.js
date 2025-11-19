/**
 * Unit tests for config.js
 */

import config from '../config.js';

describe('config', () => {
  test('should have api configuration', () => {
    expect(config.api).toBeDefined();
    expect(config.api.baseURL).toBeDefined();
    expect(typeof config.api.baseURL).toBe('string');
    expect(config.api.apiKey).toBeDefined();
  });

  test('should have file paths configuration', () => {
    expect(config.files).toBeDefined();
    expect(config.files.input).toBeDefined();
    expect(config.files.cleaned).toBeDefined();
    expect(config.files.delined).toBeDefined();
    expect(config.files.summaries).toBeDefined();
    expect(config.files.prompts).toBeDefined();
    expect(config.files.final).toBeDefined();
  });

  test('should have summarizer configuration', () => {
    expect(config.summarizer).toBeDefined();
    expect(config.summarizer.systemPrompt).toBeDefined();
    expect(typeof config.summarizer.systemPrompt).toBe('string');
    expect(Array.isArray(config.summarizer.bannedOutput)).toBe(true);
    expect(config.summarizer.bannedOutput.length).toBeGreaterThan(0);
  });

  test('should have prompter configuration', () => {
    expect(config.prompter).toBeDefined();
    expect(typeof config.prompter.systemOpenerFirst).toBe('function');
    expect(typeof config.prompter.systemOpenerNext).toBe('function');
    expect(typeof config.prompter.systemCloserFirst).toBe('string');
    expect(typeof config.prompter.systemCloserNext).toBe('string');
    expect(typeof config.prompter.mainInstruction).toBe('string');
  });

  test('should have rejecter configuration', () => {
    expect(config.rejecter).toBeDefined();
    expect(config.rejecter.systemPrompt).toBeDefined();
    expect(typeof config.rejecter.systemPrompt).toBe('string');
  });

  test('should have processing options', () => {
    expect(config.processing).toBeDefined();
    expect(typeof config.processing.maxRetries).toBe('number');
    expect(config.processing.maxRetries).toBeGreaterThan(0);
    expect(typeof config.processing.retryDelay).toBe('number');
    expect(config.processing.retryDelay).toBeGreaterThan(0);
  });

  test('prompter functions should return strings', () => {
    const book = 'Test Novel';
    const firstResult = config.prompter.systemOpenerFirst(book);
    const nextResult = config.prompter.systemOpenerNext(book);

    expect(typeof firstResult).toBe('string');
    expect(firstResult).toContain(book);
    expect(typeof nextResult).toBe('string');
    expect(nextResult).toContain(book);
  });

  test('banned output should contain common meta-commentary phrases', () => {
    const bannedPhrases = config.summarizer.bannedOutput;

    expect(bannedPhrases).toContain('in this passage');
    expect(bannedPhrases).toContain('in conclusion');
    expect(bannedPhrases).toContain('overall,');
  });

  test('file paths should use consistent naming', () => {
    expect(config.files.input).toContain('.json');
    expect(config.files.cleaned).toContain('.json');
    expect(config.files.delined).toContain('.json');
    expect(config.files.summaries).toContain('.json');
    expect(config.files.prompts).toContain('.json');
    expect(config.files.final).toContain('.json');
  });
});
