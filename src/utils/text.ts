/**
 * Checks if the first letter of a string is Arabic
 * @param text The text to check
 * @returns boolean indicating if the first letter is Arabic
 */
export const isFirstLetterArabic = (text: string): boolean => {
  if (!text) return false;
  
  // Remove any leading whitespace and get the first character
  const firstChar = text.trim().charAt(0);
  
  // Arabic Unicode range: \u0600-\u06FF or \u0750-\u077F or \u08A0-\u08FF
  // Also include Arabic presentation forms: \uFB50-\uFDFF and \uFE70-\uFEFF
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  return arabicRegex.test(firstChar);
};