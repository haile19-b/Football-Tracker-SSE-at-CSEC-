import { useEffect, useState } from "react";

// hooks/useMatchSSE.ts
export const useMatchSSE = (matchId?: string) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      matchId 
        ? `http://localhost:5000/api/match/stream/${matchId}`
        : 'http://localhost:5000/api/match/stream'
    );

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'INITIAL_DATA':
            setMatches(data.matches);
            break;
          case 'INITIAL_MATCH_DATA':
            setCurrentMatch(data.match);
            break;
          case 'MATCH_ADDED':
            setMatches(prev => [...prev, data.match]);
            break;
          case 'MATCH_UPDATED':
            setMatches(prev => prev.map(match => 
              match._id === data.matchId ? data.match : match
            ));
            if (currentMatch && currentMatch._id === data.matchId) {
              setCurrentMatch(data.match);
            }
            break;
          case 'MATCH_STATUS_CHANGED':
          case 'MATCH_STARTED':
            setMatches(prev => prev.map(match => 
              match._id === data.matchId ? data.match : match
            ));
            if (currentMatch && currentMatch._id === data.matchId) {
              setCurrentMatch(data.match);
            }
            break;
          case 'MATCH_EVENT':
            if (currentMatch && currentMatch._id === data.matchId) {
              setCurrentMatch(data.match);
            }
            break;
          default:
            console.log('Unknown event type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [matchId,currentMatch?._id]);

  return { matches, currentMatch, isConnected };
};