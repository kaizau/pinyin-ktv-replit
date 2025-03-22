/**
 * Extracts YouTube video ID from URL
 */
export function extractYoutubeId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[7].length === 11) {
    return match[7];
  }
  throw new Error("Invalid YouTube URL");
}

/**
 * Extract YouTube video information using oEmbed API
 */
export async function extractYoutubeInfo(url: string): Promise<{
  videoId: string;
  title: string;
  channel: string;
}> {
  try {
    const videoId = extractYoutubeId(url);
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch video information");
    }
    
    const data = await response.json();
    
    // Extract title and channel information
    const title = data.title;
    const channel = data.author_name;
    
    return {
      videoId,
      title,
      channel
    };
  } catch (error) {
    console.error("Error extracting YouTube info:", error);
    throw error;
  }
}
