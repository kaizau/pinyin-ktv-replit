import { useEffect, useRef, useState } from 'react';

// YouTube IFrame API types
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            modestbranding?: number;
            rel?: number;
            showinfo?: number;
            fs?: number;
            playsinline?: number;
          };
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: any) => void;
          };
        }
      ) => {
        destroy: () => void;
        getCurrentTime: () => number;
        getDuration: () => number;
        getPlayerState: () => number;
        loadVideoById: (videoId: string) => void;
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
      };
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onReady?: (player: any) => void;
  onSeek?: (seekFn: (time: number) => void) => void;
}

export default function YouTubePlayer({
  videoId,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnd,
  onReady,
  onSeek,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  // Load the YouTube API script
  useEffect(() => {
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    // Define the callback for when the YouTube API is ready
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) {
        previousCallback();
      }
      initializePlayer();
    };

    // Check if YT is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    return () => {
      // Restore previous callback if it existed
      window.onYouTubeIframeAPIReady = previousCallback;
      
      // Clear the time update interval
      if (timeUpdateIntervalRef.current) {
        window.clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      
      // Destroy the player if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Update player when videoId changes
  useEffect(() => {
    if (playerRef.current && playerReady && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, playerReady]);

  const initializePlayer = () => {
    if (!containerRef.current || !window.YT || !window.YT.Player) return;
    
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event: { target: any }) => {
          setPlayerReady(true);
          if (onReady) onReady(event.target);
          
          // Start time update interval when player is ready
          if (timeUpdateIntervalRef.current) {
            window.clearInterval(timeUpdateIntervalRef.current);
          }
          
          timeUpdateIntervalRef.current = window.setInterval(() => {
            if (playerRef.current && onTimeUpdate) {
              try {
                const currentTime = playerRef.current.getCurrentTime();
                onTimeUpdate(currentTime);
              } catch (e) {
                console.error("Error getting current time:", e);
              }
            }
          }, 100); // Update every 100ms for smoother sync
        },
        onStateChange: (event: { data: number }) => {
          // YT.PlayerState values: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
          if (event.data === window.YT.PlayerState.PLAYING) {
            if (onPlay) onPlay();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            if (onPause) onPause();
          } else if (event.data === window.YT.PlayerState.ENDED) {
            if (onEnd) onEnd();
          }
        },
      },
    });
  };

  // Provide a method to seek to a specific time
  const seekTo = (time: number) => {
    if (playerRef.current && playerReady) {
      playerRef.current.seekTo(time, true);
    }
  };

  // Expose the seekTo method to parent components
  useEffect(() => {
    if (onSeek) {
      onSeek(seekTo);
    }
  }, [onSeek, playerReady]);

  return (
    <div className="youtube-player-container w-full h-full">
      <div ref={containerRef} className="w-full h-full"></div>
    </div>
  );
}