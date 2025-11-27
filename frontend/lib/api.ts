// lib/api.ts
const API_BASE_URL = 'http://localhost:5000'; // Your Express server URL

export const matchAPI = {
  // Get all matches - now using GET /match
  getMatches: async (): Promise<Match[]> => {
    const response = await fetch(`${API_BASE_URL}/match`);
    return response.json();
  },

  // Create match - POST /match/add
  createMatch: async (matchData: CreateMatchData): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/api/match/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MatchData: matchData }),
    });
    return response.json();
  },

  // Start match - POST /match/start
  startMatch: async (matchId: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/api/match/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MatchId: matchId }),
    });
    return response.json();
  },

  // Change match status - POST /match/change-status
  changeMatchStatus: async (matchId: string, newStatus: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/api/match/change-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MatchId: matchId, newStatus }),
    });
    return response.json();
  },

  // Add match event - POST /match/add-event
  addMatchEvent: async (matchId: string, eventData: any): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/api/match/add-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, ...eventData }),
    });
    return response.json();
  },
};