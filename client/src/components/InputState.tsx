import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { extractYoutubeInfo } from '@/lib/youtube';
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from './ThemeToggle';

interface InputStateProps {
  onVideoSubmit: (data: {
    videoId: string;
    title: string;
    channel: string;
    searchQuery: string;
  }) => void;
}

export default function InputState({ onVideoSubmit }: InputStateProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const { toast } = useToast();

  const handleClearInput = () => {
    setYoutubeUrl('');
    setSongTitle('');
    setShowSongInfo(false);
    setError(null);
  };

  const handleVideoUrlInput = async (url: string) => {
    setYoutubeUrl(url);
    
    // Only process if the URL seems like a YouTube URL
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      setIsLoading(true);
      setError(null);
      
      try {
        const { videoId, title, channel } = await extractYoutubeInfo(url);
        setSongTitle(title);
        setShowSongInfo(true);
        setIsLoading(false);
        
        // Automatically submit for search if we have valid data
        if (videoId && title) {
          onVideoSubmit({
            videoId,
            title,
            channel,
            searchQuery: title
          });
        }
      } catch (err) {
        setIsLoading(false);
        setError('Could not extract video information. Please check the URL and try again.');
        console.error(err);
      }
    } else if (url && !url.includes('youtube.com') && !url.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { videoId, title, channel } = await extractYoutubeInfo(youtubeUrl);
      const searchQuery = songTitle || title;
      
      onVideoSubmit({
        videoId,
        title,
        channel,
        searchQuery
      });
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError('Error processing the YouTube URL. Please try again.');
      console.error(err);
    }
  };

  const useSampleUrl = (url: string) => {
    setYoutubeUrl(url);
    handleVideoUrlInput(url);
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Theme toggle in top right */}
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg className="h-8 w-8 text-youtube" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            <h1 className="text-2xl font-bold">Pinyin Karaoke</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                {/* YouTube URL Input */}
                <div className="mb-6">
                  <label htmlFor="youtube-url" className="block text-sm font-medium mb-2">
                    YouTube URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-youtube" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                    </div>
                    <Input
                      type="url"
                      id="youtube-url"
                      className="pl-10 pr-12"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => handleVideoUrlInput(e.target.value)}
                    />
                    {youtubeUrl && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          onClick={handleClearInput}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Song Title Input (conditionally shown) */}
                {showSongInfo && (
                  <div className="mb-6">
                    <label htmlFor="song-title" className="block text-sm font-medium mb-2">
                      Song Title & Artist
                    </label>
                    <Input
                      type="text"
                      id="song-title"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="Edit if needed for better search results"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-youtube hover:bg-youtube-dark text-white font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find Lyrics
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Loading Indicator */}
          {isLoading && !error && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-youtube"></div>
              <p className="mt-2 text-text-muted dark:text-gray-400">Fetching video information...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Recommended Songs */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Popular Chinese Songs:</h3>
            <div className="flex flex-wrap gap-2">
              <Badge 
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => useSampleUrl("https://www.youtube.com/watch?v=bu7nU9Mhpyo")}
              >
                告白氣球 - 周杰倫
              </Badge>
              <Badge 
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => useSampleUrl("https://www.youtube.com/watch?v=Hlp8XD0R5qo")}
              >
                孤勇者 - 陳奕迅
              </Badge>
              <Badge 
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => useSampleUrl("https://www.youtube.com/watch?v=be2wvNFTLMc")}
              >
                隱形的翅膀 - 張韶涵
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
