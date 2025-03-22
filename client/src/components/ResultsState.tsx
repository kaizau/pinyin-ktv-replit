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
