import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import SearchResultsView from './SearchResultsView';
import LyricsView from './LyricsView';
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

export default function ResultsState({ videoData, onReturn }: ResultsStateProps) {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // Refs for player and intervals
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  if (!videoData) {
    return null;
  }

  // Track time manually since iframe API has limited time tracking
  const startTimeTracking = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    let startTracking = Date.now();
    let accumulatedTime = currentTime; // Start from current time
    
    console.log('Starting time tracking from', accumulatedTime);
    
    // Create a timer that updates every 100ms for smoother syncing
    intervalRef.current = window.setInterval(() => {
      // Calculate elapsed time since tracking started
      const elapsed = (Date.now() - startTracking) / 1000;
      const newTime = accumulatedTime + elapsed;
      
      setCurrentTime(newTime);
      
      // Also try to send a postMessage to get the time from YouTube
      // (This likely won't work due to iframe restrictions)
      try {
        const iframe = document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'getCurrentTime',
            args: []
          }), '*');
        }
      } catch (e) {
        // Silent error - just continue with our manual tracking
      }
    }, 100); // More frequent updates for smoother syncing
  };
  
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Function to handle seeking to a specific time in the video
  const handleSeek = (time: number) => {
    try {
      // First reset our tracking to match the target time
      setCurrentTime(time);
      
      // Ensure we restart tracking from this new time
      stopTimeTracking();
      
      // Find and control the iframe
      const iframe = document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // Format matches YouTube's expected message format
        iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${time},true]}`, '*');
        
        // Restart time tracking from this time
        setTimeout(() => {
          console.log('Restarting time tracking from seek position:', time);
          startTimeTracking();
        }, 500);
      }
    } catch (e) {
      console.error("Error seeking:", e);
    }
  };

  // Setup YouTube player when active tab changes
  useEffect(() => {
    if (activeTab !== "lyrics" || !playerContainerRef.current || !videoData?.videoId) {
      return;
    }
    
    console.log('Setting up YouTube player for:', videoData.videoId);
    
    // Clear container first
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = '';
    }
    
    // Create a simple iframe embed
    const iframe = document.createElement('iframe');
    iframe.id = 'youtube-player-iframe';
    iframe.width = '100%';
    iframe.height = '100%';
    // Use standard YouTube embed URL
    iframe.src = `https://www.youtube.com/embed/${videoData.videoId}?enablejsapi=1&origin=${window.location.origin}&modestbranding=1&playsinline=1&rel=0&controls=1`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.setAttribute('allowFullScreen', '');
    
    // Add iframe to container
    playerContainerRef.current.appendChild(iframe);
    console.log('YouTube iframe created');
    
    // Since the iframe API doesn't provide reliable player state info,
    // we'll manually detect clicks on the video element and start tracking
    const startManualTracking = () => {
      // Use a click handler on the container to start tracking
      // (This will be triggered when the user clicks play)
      const playerContainer = document.getElementById('player-container');
      if (playerContainer) {
        playerContainer.addEventListener('click', () => {
          // Small delay to let the player start
          setTimeout(() => {
            console.log('Manual tracking started via click');
            // Set current time to 0 when user first interacts
            setCurrentTime(0);
            startTimeTracking();
          }, 500);
        });
      }
    };
    
    // Give the iframe a moment to load
    setTimeout(startManualTracking, 1000);
    
    // Clean up function
    return () => {
      stopTimeTracking();
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = '';
      }
    };
  }, [activeTab, videoData?.videoId]);
  
  // Listen for messages from the YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from YouTube
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        // Try to parse the message as JSON
        const data = JSON.parse(event.data);
        
        // Check if it's a player state event
        if (data.event === "onStateChange") {
          // 1 = playing
          if (data.info === 1) {
            startTimeTracking();
          } else {
            stopTimeTracking();
          }
        }
        
        // If it's a time update
        if (data.event === "currentTime") {
          setCurrentTime(data.info);
        }
      } catch (e) {
        // Not our message or not in JSON format
      }
    };
    
    // Add event listener
    window.addEventListener("message", handleMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener("message", handleMessage);
      stopTimeTracking();
    };
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
    };
  }, []);
  
  // Handle song selection
  const handleSongSelect = (song: SongResult) => {
    setSelectedSong(song);
    setActiveTab("lyrics");
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
