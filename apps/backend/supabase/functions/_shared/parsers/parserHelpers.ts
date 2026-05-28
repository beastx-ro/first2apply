/**
 * Helper function to determine if a text likely represents salary information.
 * It checks for common currency symbols, keywords, and patterns that indicate salary.
 * @param text - The text to evaluate.
 * @returns True if the text is likely salary information, false otherwise.
 */
export function isSalaryText(text: string): boolean {
  const salaryRegex = /(?:[$€£]|\b(?:usd|eur|gbp|salary)\b|\d+\s*k\b)/i;
  if (salaryRegex.test(text)) {
    return true;
  }

  // Additional heuristic: check for numbers followed by 'per year', 'annually', etc.
  const salaryPhrases = ['per year', 'annually', 'per annum', 'per hour'];
  const lowerText = text.toLowerCase();
  if (/\d/.test(text) && salaryPhrases.some((phrase) => lowerText.includes(phrase))) {
    return true;
  }

  return false;
}
