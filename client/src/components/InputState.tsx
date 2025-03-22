import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractYoutubeInfo } from '@/lib/youtube';
import { useToast } from "@/hooks/use-toast";

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
    <>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-youtube" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            <h1 className="text-xl font-bold">Pinyin Karaoke</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">YouTube Pinyin Karaoke Generator</h2>
            <p className="text-text-muted dark:text-gray-400">Generate pinyin lyrics for Chinese songs from YouTube</p>
          </div>

          <Card className="mb-6">
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
                  <p className="mt-1 text-xs text-text-muted dark:text-gray-400">
                    Paste a YouTube URL of a Chinese song
                  </p>
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
                    <p className="mt-1 text-xs text-text-muted dark:text-gray-400">
                      Edit if needed for more accurate search results
                    </p>
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
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sample URLs */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Try these examples:</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-white dark:bg-gray-800"
                onClick={() => useSampleUrl('https://www.youtube.com/watch?v=cYCYlaKQFMM')}
              >
                周杰倫 - 青花瓷
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-white dark:bg-gray-800"
                onClick={() => useSampleUrl('https://www.youtube.com/watch?v=bu7nU9Mhpyo')}
              >
                鄧紫棋 - 泡沫
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-white dark:bg-gray-800"
                onClick={() => useSampleUrl('https://www.youtube.com/watch?v=qX2GsMj7154')}
              >
                五月天 - 倔強
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-text-muted dark:text-gray-400">
            <p>YouTube Pinyin Karaoke Generator</p>
            <div className="flex gap-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-text-light dark:hover:text-text-dark transition-colors">Help</a>
              <a href="#" className="hover:text-text-light dark:hover:text-text-dark transition-colors">About</a>
              <a href="#" className="hover:text-text-light dark:hover:text-text-dark transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
