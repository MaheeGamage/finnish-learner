/**
 * Check if user has any text selected
 * @returns boolean - true if text is selected, false otherwise
 */
export const hasTextSelection = (): boolean => {
    const selection = window.getSelection();
    return !!(selection && selection.toString().trim().length > 0);
};

/**
 * Clean text copied from PDFs or other sources that may contain formatting artifacts
 * Removes:
 * - Hyphenation at line breaks (e.g., "exam-\nple" -> "example")
 * - Extra whitespace and line breaks within paragraphs
 * - Page numbers (standalone numbers on their own lines)
 * - Multiple spaces
 * - Special invisible characters
 * 
 * Preserves:
 * - Paragraph breaks (double line breaks)
 * - Intentional punctuation
 * - Original content and meaning
 * 
 * @param text - The text to clean
 * @returns Cleaned text
 */
export const cleanCopiedText = (text: string): string => {
    if (!text) return text;

    let cleaned = text;

    // Remove zero-width characters and other invisible Unicode characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Replace non-breaking spaces with regular spaces
    cleaned = cleaned.replace(/\u00A0/g, ' ');

    // Remove hyphenation at line breaks (word-\nword -> wordword)
    cleaned = cleaned.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');

    // Preserve paragraph breaks by temporarily replacing them
    cleaned = cleaned.replace(/\n\s*\n/g, '<<<PARAGRAPH_BREAK>>>');

    // Remove page numbers (standalone numbers on their own lines or with "Page" prefix)
    cleaned = cleaned.replace(/\n\s*(?:Page\s+)?\d+\s*\n/gi, '\n');
    cleaned = cleaned.replace(/^\s*(?:Page\s+)?\d+\s*\n/gi, '');
    cleaned = cleaned.replace(/\n\s*(?:Page\s+)?\d+\s*$/gi, '');

    // Replace single line breaks with spaces (merge lines within paragraphs)
    cleaned = cleaned.replace(/(?<!\n)\n(?!\n)/g, ' ');

    // Restore paragraph breaks
    cleaned = cleaned.replace(/<<<PARAGRAPH_BREAK>>>/g, '\n\n');

    // Replace multiple spaces with single space
    cleaned = cleaned.replace(/ {2,}/g, ' ');

    // Replace multiple line breaks (more than 2) with double line break
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim leading/trailing whitespace from each paragraph
    cleaned = cleaned
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .join('\n\n');

    // Final trim
    cleaned = cleaned.trim();

    return cleaned;
};
