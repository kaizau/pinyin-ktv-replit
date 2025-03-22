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
    
    // Clear the container first
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = '';
    }
    
    // Create player div with proper styling for containment
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtube-player';
    playerDiv.style.position = 'absolute';
    playerDiv.style.top = '0';
    playerDiv.style.left = '0';
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    playerContainerRef.current.appendChild(playerDiv);
    
    // Create YouTube player
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoData.videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        fs: 0, // Disable fullscreen button
        controls: 1
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Video section - always on top, fixed height to prevent layout issues */}
      <div className="w-full flex-shrink-0">
        {/* Fixed height container for video with contained overflow */}
        <div className="w-full bg-black h-[200px] sm:h-[250px] md:h-[300px] relative overflow-hidden">
          {/* Player container with maintained aspect ratio */}
          <div 
            id="player-container"
            className="absolute inset-0 w-full h-full overflow-hidden"
            ref={playerContainerRef}
          >
            {/* YouTube player will be inserted here */}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-2 flex items-center justify-between">
          <div className="flex-1 truncate">
            <h2 className="font-medium text-sm truncate">{videoData.title}</h2>
            <p className="text-text-muted dark:text-gray-400 text-xs truncate">{videoData.channel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReturn}
              className="flex-shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="sr-only md:not-sr-only md:ml-2">New Search</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content section - takes remaining height, scrollable internally */}
      <div className="flex-grow overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="w-full bg-white dark:bg-gray-900 shadow-md flex-shrink-0 z-10">
            <TabsTrigger value="search" className="flex-1">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Results
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="flex-1">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Lyrics
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto h-full">
            <TabsContent value="search" className="mt-0 p-3 h-full">
              <SearchResultsView 
                searchQuery={videoData.searchQuery} 
                onSelectSong={handleSongSelect}
              />
            </TabsContent>

            <TabsContent value="lyrics" className="mt-0 p-3 h-full">
              <LyricsView 
                selectedSong={selectedSong} 
                currentTime={currentTime}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
