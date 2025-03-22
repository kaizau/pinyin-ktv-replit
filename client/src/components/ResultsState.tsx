import { useState, useRef, useEffect } from 'react';
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
      ) => YTPlayer;
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

// Custom type for our player reference (supports both YT.Player and our manual fallback)
interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
  [key: string]: any;
}

export default function ResultsState({ videoData, onReturn }: ResultsStateProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  if (!videoData) {
    return null;
  }

  // Load YouTube API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      // Only load the API once
      if (!document.getElementById('youtube-api')) {
        console.log('Loading YouTube API...');
        // Setup callback before loading script
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API is ready');
          setPlayerReady(true);
        };
        
        // Create and insert script
        const tag = document.createElement('script');
        tag.id = 'youtube-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      } else {
        // If script is already loaded, check if YT object exists
        if (window.YT && window.YT.Player) {
          console.log('YouTube API already loaded');
          setPlayerReady(true);
        } else {
          console.log('YouTube API script exists but not ready yet');
          // Set up callback anyway as a fallback
          window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube API is ready (fallback)');
            setPlayerReady(true);
          };
        }
      }
    };

    loadYouTubeAPI();
    
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
    if (!playerReady || !videoData?.videoId || !playerContainerRef.current) {
      console.log('Conditions not met for player creation:', { 
        playerReady, 
        hasVideoId: !!videoData?.videoId, 
        hasContainer: !!playerContainerRef.current 
      });
      return;
    }
    
    console.log('Attempting to create YouTube player for video:', videoData.videoId);
    
    // Create an iframe directly instead of using YT.Player
    const createPlayerManually = () => {
      if (!playerContainerRef.current) return;
      
      // Clear container first
      playerContainerRef.current.innerHTML = '';
      
      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.id = 'youtube-player-iframe';
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = `https://www.youtube.com/embed/${videoData.videoId}?enablejsapi=1&origin=${window.location.origin}&modestbranding=1&playsinline=1&rel=0&controls=1`;
      iframe.allowFullscreen = true;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      
      playerContainerRef.current.appendChild(iframe);
      console.log('Created YouTube iframe manually');
      
      // We'll need to implement a simpler seek method
      // that uses postMessage to control the iframe
      playerRef.current = {
        seekTo: (seconds: number) => {
          const iframe = document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [seconds, true]
            }), '*');
          }
        },
        getCurrentTime: () => {
          // This is a limitation - we can't easily get current time
          // We could track it ourselves approximately
          return currentTime;
        },
        destroy: () => {
          if (playerContainerRef.current) {
            playerContainerRef.current.innerHTML = '';
          }
        }
      };
    };
    
    // Try with YouTube API first
    const createPlayerWithAPI = () => {
      if (!playerContainerRef.current || !window.YT || !window.YT.Player) {
        console.log('YT API not available, falling back to manual iframe');
        createPlayerManually();
        return;
      }
      
      // Clear the container first
      playerContainerRef.current.innerHTML = '';
      
      // Create player div
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      playerDiv.style.position = 'absolute';
      playerDiv.style.top = '0';
      playerDiv.style.left = '0';
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      playerContainerRef.current.appendChild(playerDiv);
      
      try {
        console.log('Creating player with YT API...');
        // Create YouTube player
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoData.videoId,
          playerVars: {
            autoplay: 0, // Disable autoplay
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            fs: 1, // Enable fullscreen button
            controls: 1
          },
          events: {
            onReady: () => {
              console.log('YouTube player ready');
              startTimeTracking();
            },
            onStateChange: (event: any) => {
              if (event.data === 1) { // Playing
                startTimeTracking();
              } else {
                stopTimeTracking();
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              // Fall back to manual iframe on error
              createPlayerManually();
            }
          }
        });
      } catch (e) {
        console.error("Error creating YouTube player:", e);
        createPlayerManually();
      }
    };
    
    // Try API method first, with a fallback
    createPlayerWithAPI();
    
    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.error("Error destroying YouTube player:", e);
        }
      }
    };
  }, [playerReady, videoData?.videoId, currentTime]);
  
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
  
  // Function to seek to a specific time in the video
  const handleSeek = (time: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Breadcrumb navigation bar */}
      <div className="w-full bg-white dark:bg-gray-900 p-3 flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReturn}
            className="flex items-center px-2 py-1"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Choose Video
          </Button>
          
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          <Button
            variant={activeTab === "search" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("search")}
            className="flex items-center px-2 py-1"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Choose Lyrics
          </Button>
          
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          <Button
            variant={activeTab === "lyrics" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("lyrics")}
            className="flex items-center px-2 py-1"
            disabled={!selectedSong}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Player
          </Button>
        </div>
        
        <div className="ml-auto flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
          {videoData.title}
        </div>
      </div>

      {/* Content area - depends on active tab */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Video section - only shown when in lyrics tab */}
        {activeTab === "lyrics" && (
          <div className="w-full flex-shrink-0">
            <div className="w-full bg-black h-[200px] sm:h-[250px] md:h-[300px] relative overflow-hidden">
              <div 
                id="player-container"
                className="absolute inset-0 w-full h-full overflow-hidden"
                ref={playerContainerRef}
              >
                {/* YouTube player will be inserted here */}
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === "search" && (
            <div className="h-full p-3">
              <SearchResultsView 
                searchQuery={videoData.searchQuery} 
                onSelectSong={handleSongSelect}
              />
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="h-full p-3">
              <LyricsView 
                selectedSong={selectedSong} 
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
