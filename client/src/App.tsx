import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import InputState from "@/components/InputState";
import ResultsState from "@/components/ResultsState";

function Router() {
  const [currentState, setCurrentState] = useState<"input" | "results">("input");
  const [videoData, setVideoData] = useState<{
    videoId: string;
    title: string;
    channel: string;
    searchQuery: string;
  } | null>(null);

  // Apply theme based on system preference only
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Listen for changes in system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleVideoSubmit = (data: {
    videoId: string;
    title: string;
    channel: string;
    searchQuery: string;
  }) => {
    setVideoData(data);
    setCurrentState("results");
  };

  const returnToInput = () => {
    setCurrentState("input");
  };

  return (
    <Switch>
      <Route path="/">
        <div className="min-h-screen flex flex-col font-sans bg-background-light text-text-light transition-colors duration-300 dark:bg-background-dark dark:text-text-dark">
          <div className="mx-auto w-full max-w-[1600px]">
            {currentState === "input" ? (
              <InputState onVideoSubmit={handleVideoSubmit} />
            ) : (
              <div className="flex flex-col h-screen overflow-hidden">
                <ResultsState 
                  videoData={videoData}
                  onReturn={returnToInput}
                />
              </div>
            )}
          </div>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
