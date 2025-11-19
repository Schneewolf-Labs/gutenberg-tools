/**
 * Unit tests for clean-text.js
 */

import { cleanGutenbergText } from '../clean-text.js';

describe('cleanGutenbergText', () => {
  test('should replace Unicode quotes with standard quotes', () => {
    const input = '\u201CHello World\u201D';
    const expected = '"Hello World"';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should replace Unicode apostrophes with standard apostrophes', () => {
    const input = 'It\u2019s a beautiful day';
    const expected = "It's a beautiful day";
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should replace em-dashes and en-dashes with double hyphens', () => {
    const input = 'Hello\u2014world\u2013test';
    const expected = 'Hello--world--test';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should remove illustration tags', () => {
    const input = 'Text here [Illustration: A picture] more text';
    const expected = 'Text here more text';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should remove asterisk separator lines', () => {
    const input = 'Text\n\n* * * * *\n\nMore text';
    const result = cleanGutenbergText(input);
    expect(result).not.toContain('*');
    expect(result).toContain('Text');
    expect(result).toContain('More text');
  });

  test('should remove decorative separator lines', () => {
    const input = 'Text\n\n---\n\nMore text';
    const result = cleanGutenbergText(input);
    expect(result).not.toContain('---');
  });

  test('should normalize line endings', () => {
    const input = 'Line one\r\nLine two\r\nLine three';
    const result = cleanGutenbergText(input);
    expect(result).not.toContain('\r');
  });

  test('should preserve paragraph breaks', () => {
    const input = 'Paragraph one.\n\nParagraph two.';
    const result = cleanGutenbergText(input);
    expect(result).toContain('\n\n');
  });

  test('should trim spaces inside quotes', () => {
    const input = '"  Hello World  "';
    const expected = '"Hello World"';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should handle THE END marker', () => {
    const input = 'Story text\n\nTHE END\n\nGutenberg footer text';
    const result = cleanGutenbergText(input);
    expect(result).toContain('THE END');
    expect(result).not.toContain('footer');
  });

  test('should join wrapped lines within paragraphs', () => {
    const input = 'This is a\nwrapped\nline.\n\nNew paragraph.';
    const result = cleanGutenbergText(input);
    expect(result).toContain('This is a wrapped line.');
    expect(result).toContain('New paragraph.');
  });

  test('should normalize multiple spaces to single space', () => {
    const input = 'Too    many     spaces';
    const expected = 'Too many spaces';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should handle empty input', () => {
    const input = '';
    const expected = '';
    expect(cleanGutenbergText(input)).toBe(expected);
  });

  test('should handle complex Gutenberg text', () => {
    const input = `"Curly quotes" and 'single quotes' are common.
Em—dashes appear.

[Illustration: Picture]

* * * * *

Normal text here.`;

    const result = cleanGutenbergText(input);

    expect(result).toContain('"Curly quotes"');
    expect(result).toContain("'single quotes'");
    expect(result).toContain('Em--dashes');
    expect(result).not.toContain('[Illustration');
    expect(result).not.toContain('* * *');
    expect(result).toContain('Normal text here.');
  });

  test('should add paragraph breaks after dialog followed by capital letter', () => {
    const input = '"Hello there." She said.';
    const result = cleanGutenbergText(input);
    // Should insert paragraph break between dialog and narration
    expect(result).toMatch(/"Hello there\."\s+She said\./);
  });
});
