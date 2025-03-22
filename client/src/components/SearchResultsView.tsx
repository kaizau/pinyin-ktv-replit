import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { SongResult } from '@shared/schema';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsViewProps {
  searchQuery: string;
  onSelectSong: (song: SongResult) => void;
}

export default function SearchResultsView({ searchQuery, onSelectSong }: SearchResultsViewProps) {
  const { data, isLoading, error } = useQuery<SongResult[]>({
    queryKey: [`/api/genius/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 rounded mb-2" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
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
        <AlertDescription>
          Error loading search results: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertDescription className="flex items-start">
          <svg className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium">No lyrics found</h3>
            <p className="mt-1 text-sm">
              Try modifying the search query or try another video
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-text-muted dark:text-gray-400 text-sm mb-2">
          Showing results for: <span className="font-medium">{searchQuery}</span>
        </p>
        
        <div className="space-y-3">
          {data.map((result) => (
            <div 
              key={result.id}
              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg p-3 cursor-pointer transition-colors"
              onClick={() => onSelectSong(result)}
            >
              <div className="flex items-center gap-4">
                {result.thumbnailUrl && (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{result.title}</h3>
                  <p className="text-text-muted dark:text-gray-400">{result.artist}</p>
                  {result.album && (
                    <p className="text-xs text-text-muted dark:text-gray-500 mt-1">
                      Album: {result.album} {result.year ? `• ${result.year}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-primary dark:text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
