/**
 * Unit tests for deliner.js
 */

import { convertLineBreaksToSpaces } from '../deliner.js';

describe('convertLineBreaksToSpaces', () => {
  test('should convert single line breaks to spaces', () => {
    const input = 'Line one\nLine two\nLine three';
    const expected = 'Line one Line two Line three';
    expect(convertLineBreaksToSpaces(input)).toBe(expected);
  });

  test('should preserve paragraph breaks (double line breaks)', () => {
    const input = 'Paragraph one.\n\nParagraph two.';
    const expected = 'Paragraph one.\n\nParagraph two.';
    expect(convertLineBreaksToSpaces(input)).toBe(expected);
  });

  test('should handle mixed single and double line breaks', () => {
    const input = 'Line one\nLine two\n\nParagraph two\nContinued';
    const result = convertLineBreaksToSpaces(input);

    expect(result).toContain('Line one Line two');
    expect(result).toContain('\n\n');
    expect(result).toContain('Paragraph two Continued');
  });

  test('should remove extra spaces created by conversion', () => {
    const input = 'Word1  \nWord2';
    const result = convertLineBreaksToSpaces(input);
    expect(result).toBe('Word1 Word2');
  });

  test('should trim leading and trailing whitespace', () => {
    const input = '  \n  Text here  \n  ';
    const result = convertLineBreaksToSpaces(input);
    expect(result).toBe('Text here');
  });

  test('should handle text with no line breaks', () => {
    const input = 'Just a simple line';
    const expected = 'Just a simple line';
    expect(convertLineBreaksToSpaces(input)).toBe(expected);
  });

  test('should handle empty string', () => {
    const input = '';
    const expected = '';
    expect(convertLineBreaksToSpaces(input)).toBe(expected);
  });

  test('should handle only line breaks', () => {
    const input = '\n\n\n';
    const result = convertLineBreaksToSpaces(input);
    expect(result).toBe('');
  });

  test('should handle complex text with poetry-like formatting', () => {
    const input = `A line of verse
Another line
And one more

New stanza here
Continues below`;

    const result = convertLineBreaksToSpaces(input);

    // Single breaks should be spaces
    expect(result).toContain('A line of verse Another line And one more');
    // Double breaks preserved
    expect(result).toContain('\n\n');
    expect(result).toContain('New stanza here Continues below');
  });

  test('should normalize multiple spaces to single space', () => {
    const input = 'Too    many\n   spaces    here';
    const result = convertLineBreaksToSpaces(input);
    expect(result).toBe('Too many spaces here');
  });

  test('should handle wrapped text from book formatting', () => {
    const input = `This is a sentence that was wrapped across
multiple lines in the original
book formatting.

This is a new paragraph.`;

    const result = convertLineBreaksToSpaces(input);

    expect(result).toContain('This is a sentence that was wrapped across multiple lines in the original book formatting.');
    expect(result).toContain('\n\n');
    expect(result).toContain('This is a new paragraph.');
  });

  test('should handle triple or more line breaks as double', () => {
    const input = 'Text one\n\n\n\nText two';
    const result = convertLineBreaksToSpaces(input);
    // Should still contain a paragraph break
    expect(result).toContain('\n\n');
    expect(result).toContain('Text one');
    expect(result).toContain('Text two');
  });
});
