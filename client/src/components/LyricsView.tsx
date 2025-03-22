import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SongResult, LyricsResponse } from '@shared/schema';
import { convertToPinyin } from '@/lib/pinyin';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface LyricsViewProps {
  selectedSong: SongResult | null;
}

interface LyricLine {
  chinese: string;
  pinyin: string;
}

export default function LyricsView({ selectedSong }: LyricsViewProps) {
  const [lyricsWithPinyin, setLyricsWithPinyin] = useState<LyricLine[]>([]);
  
  const fetchLyrics = async (id: number): Promise<LyricsResponse> => {
    const response = await axios.get(`https://lrclib.net/api/get/${id}`);
    return response.data;
  };

  const { data, isLoading, error } = useQuery<LyricsResponse>({
    queryKey: [`lrclib-lyrics-${selectedSong?.id}`],
    queryFn: () => fetchLyrics(selectedSong!.id),
    enabled: !!selectedSong,
  });

  useEffect(() => {
    if (data?.plainLyrics) {
      const processLyrics = async () => {
        // Split the lyrics into lines
        const lines = data.plainLyrics.split('\n').filter(line => line.trim() !== '');
        
        // Process each line to generate pinyin
        const processedLines = await Promise.all(
          lines.map(async (line) => {
            // Only process lines that contain Chinese characters
            const hasChinese = /[\u4e00-\u9fff]/.test(line);
            if (hasChinese) {
              const pinyin = await convertToPinyin(line);
              return { chinese: line, pinyin };
            }
            // For non-Chinese lines (like English parts), leave pinyin empty
            return { chinese: line, pinyin: '' };
          })
        );
        
        setLyricsWithPinyin(processedLines);
      };
      
      processLyrics();
    }
  }, [data]);

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

  if (!data || (!data.plainLyrics && !data.instrumental)) {
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
        
        <div className="lyrics-container font-chinese mb-6">
          {lyricsWithPinyin.map((line, index) => (
            <div key={index} className="mb-4">
              {line.pinyin && (
                <div className="text-[0.85rem] text-[#0070f3] dark:text-[#4da3ff] mb-[-0.25rem]">
                  {line.pinyin}
                </div>
              )}
              <div className="text-[1.15rem] leading-[2.5rem]">
                {line.chinese}
              </div>
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
