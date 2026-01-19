/**
 * Check if user has any text selected
 * @returns boolean - true if text is selected, false otherwise
 */
export const hasTextSelection = (): boolean => {
    const selection = window.getSelection();
    return !!(selection && selection.toString().trim().length > 0);
};
