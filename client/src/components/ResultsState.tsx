import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import SearchResultsView from './SearchResultsView';
import LyricsView from './LyricsView';
import YouTubePlayer from './YouTubePlayer';
import ThemeToggle from './ThemeToggle';
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

  // Reference to the seekTo function from the YouTube player
  const seekToRef = useRef<((time: number) => void) | null>(null);

  // State for current search query (modifiable when search fails)
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  
  // Effect to listen for search-modified events
  useEffect(() => {
    const handleSearchModified = (event: CustomEvent) => {
      if (event.detail && event.detail.searchQuery) {
        setCurrentSearchQuery(event.detail.searchQuery);
      }
    };
    
    const resultsContainer = document.getElementById('results-state-container');
    if (resultsContainer) {
      resultsContainer.addEventListener('search-modified', handleSearchModified as EventListener);
    }
    
    return () => {
      if (resultsContainer) {
        resultsContainer.removeEventListener('search-modified', handleSearchModified as EventListener);
      }
    };
  }, []);
  
  // Set initial search query when videoData changes
  useEffect(() => {
    if (videoData) {
      setCurrentSearchQuery(videoData.searchQuery);
    }
  }, [videoData?.searchQuery]);

  if (!videoData) {
    return null;
  }

  // Function to handle seeking to a specific time in the video
  const handleSeek = (time: number) => {
    if (seekToRef.current) {
      seekToRef.current(time);
    }
    // Update our current time state as well
    setCurrentTime(time);
  };

  // Handle song selection
  const handleSongSelect = (song: SongResult) => {
    setSelectedSong(song);
    setActiveTab("lyrics");
  };

  return (
    <div id="results-state-container" className="flex flex-col h-screen overflow-hidden">
      {/* Streamlined navigation bar */}
      <div className="w-full bg-white dark:bg-gray-900 py-2 px-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-4 text-sm">
          <a 
            href="#" 
            onClick={onReturn}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "search" ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Back
          </a>

          <a 
            href="#" 
            onClick={() => setActiveTab("search")}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "search" ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Search
          </a>

          <a 
            href="#" 
            onClick={() => setActiveTab("lyrics")}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "lyrics" ? 'text-blue-500' : 'text-gray-500'}`}
            style={{ pointerEvents: !selectedSong ? 'none' : 'auto' }}
          >
            Player
          </a>
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
              >
                {/* YouTube player */}
                <YouTubePlayer 
                  videoId={videoData.videoId}
                  onTimeUpdate={setCurrentTime}
                  onSeek={(seekFn) => {
                    seekToRef.current = seekFn;
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === "search" && (
            <div className="h-full p-3">
              <SearchResultsView 
                searchQuery={currentSearchQuery} 
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