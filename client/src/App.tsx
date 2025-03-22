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

  // Handle theme based on user preference or system settings
  useEffect(() => {
    const isDark = 
      localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
          {currentState === "input" ? (
            <InputState onVideoSubmit={handleVideoSubmit} />
          ) : (
            <ResultsState 
              videoData={videoData}
              onReturn={returnToInput}
            />
          )}
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
