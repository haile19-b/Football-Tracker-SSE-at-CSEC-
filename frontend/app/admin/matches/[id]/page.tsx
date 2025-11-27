// app/admin/matches/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Clock, Trophy, Users, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface MatchEvent {
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'foul';
  team: 'teamA' | 'teamB';
  player: string;
  minute: number;
  _id?: string;
}

interface Match {
  _id: string;
  teamA: string;
  teamB: string;
  status: 'pending' | 'ongoing' | 'finished';
  time: number;
  scoreA: number;
  scoreB: number;
  location: string;
  competition: string;
  date: string;
  events: MatchEvent[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const matchAPI = {
  getMatch: async (matchId: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/api/match/${matchId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch match');
    }
    return response.json();
  },

  startMatch: async (matchId: string): Promise<{ success: boolean; data?: Match; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/match/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MatchId: matchId }),
    });
    return response.json();
  },

  finishMatch: async (matchId: string): Promise<{ success: boolean; data?: Match; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/match/change-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MatchId: matchId, newStatus: 'finished' }),
    });
    return response.json();
  },

  addEvent: async (matchId: string, eventData: Omit<MatchEvent, '_id'>): Promise<{ success: boolean; data?: Match; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/match/add-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId,
        eventType: eventData.eventType,
        team: eventData.team,
        player: eventData.player,
        minute: eventData.minute
      }),
    });
    return response.json();
  },

  updateScore: async (matchId: string, scoreA: number, scoreB: number): Promise<{ success: boolean; data?: Match; error?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/match/update-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, scoreA, scoreB }),
    });
    return response.json();
  }
};

export default function AdminMatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    eventType: 'goal' as MatchEvent['eventType'],
    team: 'teamA' as MatchEvent['team'],
    player: '',
    minute: 0
  });

  // Score update state
  const [scoreUpdate, setScoreUpdate] = useState({
    scoreA: 0,
    scoreB: 0
  });

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const matchData = await matchAPI.getMatch(matchId);
      setMatch(matchData);
      setScoreUpdate({
        scoreA: matchData.scoreA,
        scoreB: matchData.scoreB
      });
    } catch (error) {
      setError('Failed to load match. Please check if the match exists.');
      console.error('Error loading match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async () => {
    setIsLoadingAction(true);
    try {
      const result = await matchAPI.startMatch(matchId);
      if (result.success && result.data) {
        setMatch(result.data);
        setScoreUpdate({
          scoreA: result.data.scoreA,
          scoreB: result.data.scoreB
        });
        setError(null);
      } else {
        setError(result.error || 'Failed to start match');
      }
    } catch (error) {
      setError('Error starting match');
      console.error('Error starting match:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const finishMatch = async () => {
    setIsLoadingAction(true);
    try {
      const result = await matchAPI.finishMatch(matchId);
      if (result.success && result.data) {
        setMatch(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to finish match');
      }
    } catch (error) {
      setError('Error finishing match');
      console.error('Error finishing match:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.player || newEvent.minute < 0) {
      setError('Please fill all event fields');
      return;
    }

    setIsLoadingAction(true);
    try {
      const result = await matchAPI.addEvent(matchId, newEvent);
      if (result.success && result.data) {
        setMatch(result.data);
        setNewEvent({
          eventType: 'goal',
          team: 'teamA',
          player: '',
          minute: 0
        });
        setError(null);
      } else {
        setError(result.error || 'Failed to add event');
      }
    } catch (error) {
      setError('Error adding event');
      console.error('Error adding event:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const updateScore = async () => {
    setIsLoadingAction(true);
    try {
      const result = await matchAPI.updateScore(matchId, scoreUpdate.scoreA, scoreUpdate.scoreB);
      if (result.success && result.data) {
        setMatch(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to update score');
      }
    } catch (error) {
      setError('Error updating score');
      console.error('Error updating score:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getStatusDisplay = () => {
    if (!match) return { text: 'Loading...', color: 'text-gray-600', bg: 'bg-gray-100' };
    
    switch (match.status) {
      case 'pending':
        return { text: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'ongoing':
        return { text: `Live ${match.time}'`, color: 'text-red-600', bg: 'bg-red-100' };
      case 'finished':
        return { text: 'Finished', color: 'text-green-600', bg: 'bg-green-100' };
      default:
        return { text: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return '⚽';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'foul':
        return '⚠️';
      default:
        return '•';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'text-green-600';
      case 'yellow_card':
        return 'text-yellow-600';
      case 'red_card':
        return 'text-red-600';
      case 'foul':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Match Not Found</h3>
              <p className="text-gray-600">Match ID: {matchId}</p>
              <p className="text-gray-600 mt-2">Please check if the match exists in the database.</p>
              <Button onClick={loadMatch} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Match Info and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {match.teamA} vs {match.teamB}
                    </h1>
                    <p className="text-gray-600 mt-1">{match.competition}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    <div className="text-gray-600 mt-1 text-sm">
                      Current Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{match.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Trophy className="h-4 w-4" />
                    <span>{match.competition}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Match Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {match.status === 'pending' && (
                    <Button 
                      onClick={startMatch}
                      disabled={isLoadingAction}
                      className="flex-1"
                    >
                      {isLoadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Start Match
                    </Button>
                  )}
                  
                  {match.status === 'ongoing' && (
                    <Button 
                      onClick={finishMatch}
                      variant="destructive"
                      disabled={isLoadingAction}
                      className="flex-1"
                    >
                      {isLoadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      End Match
                    </Button>
                  )}
                  
                  {match.status === 'finished' && (
                    <Button disabled variant="outline" className="flex-1">
                      Match Ended
                    </Button>
                  )}
                </div>

                {/* Score Update */}
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="text-center">
                    <Label htmlFor="scoreA" className="text-sm font-medium">
                      {match.teamA} Score
                    </Label>
                    <Input
                      id="scoreA"
                      type="number"
                      min="0"
                      value={scoreUpdate.scoreA}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, scoreA: parseInt(e.target.value) || 0})}
                      className="text-center mt-1"
                    />
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      onClick={updateScore}
                      disabled={isLoadingAction}
                      size="sm"
                    >
                      {isLoadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Update Score"
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Label htmlFor="scoreB" className="text-sm font-medium">
                      {match.teamB} Score
                    </Label>
                    <Input
                      id="scoreB"
                      type="number"
                      min="0"
                      value={scoreUpdate.scoreB}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, scoreB: parseInt(e.target.value) || 0})}
                      className="text-center mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Event Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Match Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select 
                      value={newEvent.eventType} 
                      onValueChange={(value: MatchEvent['eventType']) => setNewEvent({...newEvent, eventType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal">Goal ⚽</SelectItem>
                        <SelectItem value="yellow_card">Yellow Card 🟨</SelectItem>
                        <SelectItem value="red_card">Red Card 🟥</SelectItem>
                        <SelectItem value="foul">Foul ⚠️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select 
                      value={newEvent.team} 
                      onValueChange={(value: MatchEvent['team']) => setNewEvent({...newEvent, team: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teamA">{match.teamA}</SelectItem>
                        <SelectItem value="teamB">{match.teamB}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="player">Player Name</Label>
                    <Input
                      id="player"
                      value={newEvent.player}
                      onChange={(e) => setNewEvent({...newEvent, player: e.target.value})}
                      placeholder="Enter player name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minute">Minute</Label>
                    <Input
                      id="minute"
                      type="number"
                      min="0"
                      max="120"
                      value={newEvent.minute}
                      onChange={(e) => setNewEvent({...newEvent, minute: parseInt(e.target.value) || 0})}
                      placeholder="Minute of event"
                    />
                  </div>
                </div>

                <Button 
                  onClick={addEvent}
                  disabled={isLoadingAction}
                  className="w-full"
                >
                  {isLoadingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Event
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events Timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Events Timeline
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
                    {match.events.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {match.events.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {match.events
                      .sort((a, b) => a.minute - b.minute)
                      .map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className={`text-lg ${getEventColor(event.eventType)}`}>
                            {getEventIcon(event.eventType)}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {event.player}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.team === 'teamA' ? match.teamA : match.teamB} • {event.minute}'
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {event.eventType.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No events recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}