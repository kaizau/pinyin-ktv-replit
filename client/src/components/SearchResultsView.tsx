import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SongResult, LrcLibSearchParams } from '@shared/schema';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from 'axios';

interface SearchResultsViewProps {
  searchQuery: string;
  onSelectSong: (song: SongResult) => void;
}

export default function SearchResultsView({ searchQuery, onSelectSong }: SearchResultsViewProps) {
  // State for modified query
  const [modifiedQuery, setModifiedQuery] = useState(searchQuery);
  const queryClient = useQueryClient();
  
  // Update modifiedQuery when searchQuery changes
  useEffect(() => {
    setModifiedQuery(searchQuery);
  }, [searchQuery]);
  
  const fetchSongs = async (query: string): Promise<SongResult[]> => {
    // Build search parameters
    const params: LrcLibSearchParams = {};
    
    // Split the query into potential artist and track components
    const queryParts = query.split(' - ');
    
    if (queryParts.length > 1) {
      // If query contains " - ", assume format is "Artist - Track"
      params.artist_name = queryParts[0];
      params.track_name = queryParts.slice(1).join(' - ');
    } else {
      // Otherwise use general search
      params.q = query;
    }
    
    const response = await axios.get('https://lrclib.net/api/search', { params });
    return response.data;
  };

  // Handle search with modified query
  const handleSearch = async () => {
    // Invalidate and refetch with the new query
    await queryClient.invalidateQueries({
      queryKey: ['lyrics-search'] 
    });
    
    // Prefetch the new query
    queryClient.prefetchQuery({
      queryKey: ['lyrics-search', modifiedQuery],
      queryFn: () => fetchSongs(modifiedQuery)
    });
    
    // Trigger a refetch of the parent component by passing the modified query back
    if (searchQuery !== modifiedQuery) {
      // Update the parent component's searchQuery
      const parentElement = document.getElementById('results-state-container');
      if (parentElement) {
        const event = new CustomEvent('search-modified', { 
          detail: { searchQuery: modifiedQuery } 
        });
        parentElement.dispatchEvent(event);
      }
    }
  };

  const { data, isLoading, error } = useQuery<SongResult[]>({
    queryKey: [`lyrics-search`, searchQuery],
    queryFn: () => fetchSongs(searchQuery),
    enabled: !!searchQuery,
  });

  // Removed duplicate loading and error handlers - using the ones below instead
  // that include the search input for consistent UI positioning

  // Render the search input component
  const renderSearchInput = () => {
    return (
      <div className="mb-6">
        <div className="w-full">
          <div className="mb-3">
            <label htmlFor="search-query" className="block text-sm font-medium mb-2">
              Search Query
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                id="search-query"
                value={modifiedQuery}
                onChange={(e) => setModifiedQuery(e.target.value)}
                placeholder="Try: Artist - Song Title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For better results, try using format: "Artist - Song Title"
          </p>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full p-4">
        {renderSearchInput()}
        <div className="space-y-4 w-full">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <Skeleton className="w-12 h-12 rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded mb-2" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full p-4">
        {renderSearchInput()}
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            Error loading search results: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty results state
  if (!data || data.length === 0) {
    return (
      <div className="h-full p-4">
        {renderSearchInput()}
        
        <Alert className="mt-4">
          <AlertDescription className="flex items-start">
            <svg className="h-5 w-5 mr-2 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium">No lyrics found</h3>
              <p className="mt-1 text-sm">
                Try modifying the search query above
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Results state
  return (
    <div className="h-full overflow-y-auto p-3">
      {renderSearchInput()}
      
      <div className="mb-4">
        <p className="text-text-muted dark:text-gray-400 text-sm">
          Found {data.length} result{data.length !== 1 ? 's' : ''} for: <span className="font-medium">{searchQuery}</span>
        </p>
      </div>
      
      <div className="space-y-3">
        {data.map((result) => (
          <div 
            key={result.id}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg p-3 cursor-pointer transition-colors"
            onClick={() => onSelectSong(result)}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden text-gray-400 flex-shrink-0">
                {result.instrumental ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base truncate">{result.trackName}</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm truncate">{result.artistName}</p>
                {result.albumName && (
                  <p className="text-xs text-text-muted dark:text-gray-500 truncate">
                    Album: {result.albumName} {result.duration ? `• ${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}` : ''}
                  </p>
                )}
              </div>
              <div className="text-primary dark:text-primary flex-shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
