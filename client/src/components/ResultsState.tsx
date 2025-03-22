import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import SearchResultsView from './SearchResultsView';
import LyricsView from './LyricsView';
import YouTubePlayer from './YouTubePlayer';
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
  const [activeTab, setActiveTab] = useState<"video" | "lyrics" | "player">("lyrics");
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
    // Add videoId to the selected song
    const songWithVideoId = {
      ...song,
      videoId: videoData.videoId
    };
    setSelectedSong(songWithVideoId);
    setActiveTab("player");
  };

  return (
    <div id="results-state-container" className="flex flex-col h-screen overflow-hidden">
      {/* Streamlined navigation bar */}
      <div className="w-full bg-white dark:bg-gray-900 py-2 px-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-4 text-sm">
          <a 
            href="#" 
            onClick={() => {
              setActiveTab("video");
              onReturn();
            }}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "video" ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Home
          </a>

          <a 
            href="#" 
            onClick={() => setActiveTab("lyrics")}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "lyrics" ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Lyrics
          </a>
          
          <a 
            href="#" 
            onClick={() => setActiveTab("player")}
            className={`px-3 py-1 hover:text-blue-500 ${activeTab === "player" ? 'text-blue-500' : 'text-gray-500'}`}
            style={{ pointerEvents: !selectedSong ? 'none' : 'auto' }}
          >
            Player
          </a>
        </div>
      </div>

      {/* Content area - depends on active tab */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Main content area */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === "video" && (
            <div className="h-full">
              {/* This will trigger the return to input state */}
            </div>
          )}

          {activeTab === "lyrics" && (
            <div className="h-full">
              <SearchResultsView 
                searchQuery={currentSearchQuery} 
                onSelectSong={handleSongSelect}
              />
            </div>
          )}

          {activeTab === "player" && selectedSong && (
            <div className="h-full flex flex-col">
              {/* Video section */}
              <div className="w-full flex-shrink-0">
                <div className="w-full bg-black h-[200px] sm:h-[250px] md:h-[300px] relative overflow-hidden">
                  <div 
                    id="player-container"
                    className="absolute inset-0 w-full h-full overflow-hidden"
                  >
                    {/* YouTube player */}
                    <YouTubePlayer 
                      videoId={selectedSong.videoId || videoData.videoId}
                      onTimeUpdate={setCurrentTime}
                      onSeek={(seekFn) => {
                        seekToRef.current = seekFn;
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Lyrics section */}
              <div className="flex-grow p-3 overflow-y-auto">
                <LyricsView 
                  selectedSong={selectedSong} 
                  currentTime={currentTime}
                  onSeek={handleSeek}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}