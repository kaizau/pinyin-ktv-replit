import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SongResult, LyricsResponse } from '@shared/schema';
import { convertToPinyin } from '@/lib/pinyin';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

interface LyricsViewProps {
  selectedSong: SongResult | null;
  currentTime?: number; // Current playback time in seconds
}

interface SyncedLyricLine {
  chinese: string;
  pinyin: string;
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
}

export default function LyricsView({ selectedSong, currentTime = 0 }: LyricsViewProps) {
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const fetchLyrics = async (id: number): Promise<LyricsResponse> => {
    const response = await axios.get(`https://lrclib.net/api/get/${id}`);
    return response.data;
  };

  const { data, isLoading, error } = useQuery<LyricsResponse>({
    queryKey: [`lrclib-lyrics-${selectedSong?.id}`],
    queryFn: () => fetchLyrics(selectedSong!.id),
    enabled: !!selectedSong,
  });

  // Parse synced lyrics if available, or fall back to plain lyrics
  useEffect(() => {
    if (!data) return;
    
    const processLyrics = async () => {
      let parsedLines: SyncedLyricLine[] = [];
      
      if (data.syncedLyrics) {
        // Parse synced lyrics format: [mm:ss.xx] text
        const syncedLines = data.syncedLyrics.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < syncedLines.length; i++) {
          const line = syncedLines[i];
          const timeMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
          
          if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseInt(timeMatch[2]);
            const hundredths = parseInt(timeMatch[3]);
            const startTime = minutes * 60 + seconds + hundredths / 100;
            
            // Get the lyric text by removing the time tag
            const text = line.replace(/^\[\d{2}:\d{2}\.\d{2}\]/, '').trim();
            
            // Determine end time (either from next line or set a default)
            let endTime = Infinity;
            if (i < syncedLines.length - 1) {
              const nextTimeMatch = syncedLines[i + 1].match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
              if (nextTimeMatch) {
                const nextMinutes = parseInt(nextTimeMatch[1]);
                const nextSeconds = parseInt(nextTimeMatch[2]);
                const nextHundredths = parseInt(nextTimeMatch[3]);
                endTime = nextMinutes * 60 + nextSeconds + nextHundredths / 100;
              }
            }
            
            // Check if it contains Chinese characters
            const hasChinese = /[\u4e00-\u9fff]/.test(text);
            if (hasChinese) {
              const pinyin = await convertToPinyin(text);
              parsedLines.push({ chinese: text, pinyin, startTime, endTime });
            } else {
              parsedLines.push({ chinese: text, pinyin: '', startTime, endTime });
            }
          }
        }
      } else if (data.plainLyrics) {
        // Fall back to plain lyrics if no synced lyrics available
        const lines = data.plainLyrics.split('\n').filter(line => line.trim() !== '');
        
        // Create approximate timing for plain lyrics (3 seconds per line)
        const processedLines = await Promise.all(
          lines.map(async (line, index) => {
            const startTime = index * 3; // 3 seconds per line
            const endTime = (index + 1) * 3;
            
            // Check if it contains Chinese characters
            const hasChinese = /[\u4e00-\u9fff]/.test(line);
            if (hasChinese) {
              const pinyin = await convertToPinyin(line);
              return { chinese: line, pinyin, startTime, endTime };
            }
            return { chinese: line, pinyin: '', startTime, endTime };
          })
        );
        
        parsedLines = processedLines;
      }
      
      setSyncedLyrics(parsedLines);
    };
    
    processLyrics();
  }, [data]);

  // Update current line index based on playback time
  useEffect(() => {
    if (syncedLyrics.length === 0 || currentTime === undefined) return;
    
    const newIndex = syncedLyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    
    if (newIndex !== -1 && newIndex !== currentLineIndex) {
      setCurrentLineIndex(newIndex);
      
      // Scroll to the active line
      if (lyricsContainerRef.current) {
        const lineElement = lyricsContainerRef.current.querySelector(`[data-line-index="${newIndex}"]`);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, syncedLyrics, currentLineIndex]);

  // Reset current line when song changes
  useEffect(() => {
    setCurrentLineIndex(-1);
  }, [selectedSong]);

  if (!selectedSong) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Please select a song from the search results to view lyrics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 rounded mb-2" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          </div>
          <div className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-5/6 rounded mb-2" />
                <Skeleton className="h-5 w-4/6 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-start">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium">Could not load lyrics</h3>
            <p className="mt-1 text-sm">
              Unable to retrieve or process lyrics for this song
            </p>
            <button 
              className="mt-3 text-sm font-medium bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 px-3 py-1 rounded-md"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || (!data.plainLyrics && !data.syncedLyrics && !data.instrumental)) {
    return (
      <Alert>
        <AlertDescription className="flex items-start">
          <svg className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium">No lyrics found</h3>
            <p className="mt-1 text-sm">
              No lyrics could be found for this song
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Handle instrumental tracks
  if (data.instrumental) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-lg">{data.trackName}</h3>
              <p className="text-text-muted dark:text-gray-400">{data.artistName}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <h4 className="text-lg font-medium mb-2">Instrumental Track</h4>
            <p className="text-text-muted dark:text-gray-400">
              This is an instrumental track with no lyrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSyncedLyrics = data.syncedLyrics && data.syncedLyrics.trim() !== '';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-lg">{data.trackName}</h3>
            <p className="text-text-muted dark:text-gray-400">{data.artistName}</p>
            {hasSyncedLyrics && (
              <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Synchronized
              </span>
            )}
          </div>
        </div>
        
        <div 
          className="lyrics-container font-chinese mb-6 max-h-[400px] overflow-y-auto pr-2 scroll-smooth" 
          ref={lyricsContainerRef}
        >
          {syncedLyrics.map((line, index) => (
            <div 
              key={index} 
              className={`mb-4 p-2 rounded transition-colors duration-300 ${
                index === currentLineIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 pl-3' 
                  : ''
              }`}
              data-line-index={index}
            >
              {line.pinyin && (
                <div className={`text-[0.85rem] ${
                  index === currentLineIndex 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-[#0070f3] dark:text-[#4da3ff]'
                } mb-[-0.25rem]`}>
                  {line.pinyin}
                </div>
              )}
              <div className={`text-[1.15rem] leading-[2.5rem] ${
                index === currentLineIndex ? 'font-bold' : ''
              }`}>
                {line.chinese}
              </div>
              {hasSyncedLyrics && (
                <div className="text-xs text-text-muted">
                  {Math.floor(line.startTime / 60)}:{(line.startTime % 60).toFixed(2).padStart(5, '0')}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <svg className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            About Pinyin
          </h4>
          <p className="text-sm text-text-muted dark:text-gray-400">
            Pinyin is the standard system to transcribe Mandarin Chinese pronunciation into the Latin alphabet. 
            The blue text above each line shows how to pronounce the Chinese characters.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
