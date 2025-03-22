import { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { Button } from "@/components/ui/button";
import SearchResultsView from './SearchResultsView';
import LyricsView from './LyricsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SongResult } from '@shared/schema';

interface ResultsStateProps {
  videoData: {
    videoId: string;
    title: string;
    channel: string;
    searchQuery: string;
  } | null;
  onReturn: () => void;
}

// Define YouTube API types for TypeScript
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            modestbranding?: number;
            rel?: number;
            playsinline?: number;
            [key: string]: any;
          };
          events?: {
            onReady?: (event: any) => void;
            onStateChange?: (event: any) => void;
            onError?: (event: any) => void;
            [key: string]: any;
          };
        }
      ) => any;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function ResultsState({ videoData, onReturn }: ResultsStateProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  if (!videoData) {
    return null;
  }

  // Load YouTube API
  useEffect(() => {
    // Only load the API once
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Define callback for when API is ready
      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      // If script is already loaded
      setPlayerReady(true);
    }
    
    return () => {
      // Clean up the player when component unmounts
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying YouTube player:", e);
        }
      }
    };
  }, []);
  
  // Start/stop time tracking functions
  const startTimeTracking = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Update time every 200ms
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 200);
  };
  
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Initialize YouTube player once the API is ready
  useEffect(() => {
    if (!playerReady || !videoData?.videoId || !playerContainerRef.current) return;
    
    // Create player div
    if (!document.getElementById('youtube-player')) {
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      playerContainerRef.current.appendChild(playerDiv);
    }
    
    // Create YouTube player
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoData.videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          console.log('YouTube player ready');
          // Start tracking time when player is ready
          startTimeTracking();
        },
        onStateChange: (event: any) => {
          // State 1 is playing
          if (event.data === 1) {
            startTimeTracking();
          } else {
            // Pause, stop, etc.
            stopTimeTracking();
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
        }
      }
    });
    
    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying YouTube player:", e);
        }
      }
    };
  }, [playerReady, videoData?.videoId]);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
    };
  }, []);

  const handleSongSelect = (song: SongResult) => {
    setSelectedSong(song);
    setActiveTab("lyrics");
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Panel */}
          <div className="lg:w-2/5">
            <div className="sticky top-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <div 
                    className="w-full h-0 pt-[56.25%] relative bg-black"
                    ref={playerContainerRef}
                  >
                    {/* YouTube player will be inserted here */}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-medium text-lg mb-1">{videoData.title}</h2>
                  <p className="text-text-muted dark:text-gray-400 text-sm">{videoData.channel}</p>
                  {currentTime > 0 && (
                    <div className="mt-2 text-sm text-text-muted dark:text-gray-400">
                      Current time: {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={onReturn}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Search
              </Button>
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:w-3/5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4">
                <TabsTrigger value="search" className="flex-1">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Results
                </TabsTrigger>
                <TabsTrigger value="lyrics" className="flex-1">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Lyrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-0">
                <SearchResultsView 
                  searchQuery={videoData.searchQuery} 
                  onSelectSong={handleSongSelect}
                />
              </TabsContent>

              <TabsContent value="lyrics" className="mt-0">
                <LyricsView 
                  selectedSong={selectedSong} 
                  currentTime={currentTime}
                />
              </TabsContent>
            </Tabs>
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
