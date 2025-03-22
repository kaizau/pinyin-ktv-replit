import pinyin from 'pinyin';

/**
 * Convert Chinese text to pinyin
 * @param text Chinese text to convert
 * @returns Pinyin text with tone marks
 */
export async function convertToPinyin(text: string): Promise<string> {
  try {
    // Using the pinyin library to convert Chinese to pinyin with tone marks
    const result = pinyin(text, {
      style: pinyin.STYLE_TONE, // Use tone marks (e.g., mā, má, mǎ, mà)
      heteronym: false, // Don't show multiple pronunciations for heteronyms
      segment: true, // Enable segmentation for continuous text
    });
    
    // Flatten the result array and join with spaces
    return result.map(item => item[0]).join(' ');
  } catch (error) {
    console.error('Error converting to pinyin:', error);
    return text; // Return original text if conversion fails
  }
}
