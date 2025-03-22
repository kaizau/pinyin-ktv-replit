import { useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  // Reference to the seekTo function from the YouTube player
  const seekToRef = useRef<((time: number) => void) | null>(null);

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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Streamlined navigation bar */}
      <div className="w-full bg-white dark:bg-gray-900 py-1 px-3 flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReturn}
            className="px-2 py-0 h-8"
          >
            Back
          </Button>
          
          <span className="text-gray-400 mx-1 flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
          
          <Button
            variant={activeTab === "search" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("search")}
            className="px-2 py-0 h-8"
          >
            Search
          </Button>
          
          <span className="text-gray-400 mx-1 flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
          
          <Button
            variant={activeTab === "lyrics" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("lyrics")}
            className="px-2 py-0 h-8"
            disabled={!selectedSong}
          >
            Player
          </Button>
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
