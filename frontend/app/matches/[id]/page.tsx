// app/matches/[id]/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Trophy, Users, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMatchSSE } from "@/hooks/useMatchSSE";
import { useParams } from "next/navigation";

interface MatchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface MatchEvent {
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'foul';
  team: 'teamA' | 'teamB';
  player: string;
  minute: number;
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
  createdAt?: string;
  updatedAt?: string;
}

// Client component that uses the params
function MatchDetailContent({ matchId }: { matchId: string }) {
  const { currentMatch, isConnected, error, isLoading } = useMatchSSE(matchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
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

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Match Not Found</h3>
              <p className="text-gray-600">The match you're looking for doesn't exist or couldn't be loaded.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (currentMatch.status) {
      case 'pending':
        return { text: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'ongoing':
        return { text: `Live ${currentMatch.time}'`, color: 'text-red-600', bg: 'bg-red-100' };
      case 'finished':
        return { text: 'Full Time', color: 'text-green-600', bg: 'bg-green-100' };
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Connection Status */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Offline
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-orange-100 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Match Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">
                  {currentMatch.teamA} vs {currentMatch.teamB}
                </h1>
                <p className="text-gray-600 mt-1">{currentMatch.competition}</p>
              </div>
              
              {/* Score Display */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {currentMatch.scoreA} - {currentMatch.scoreB}
                </div>
                <div className="text-gray-600 mt-1 text-sm">
                  {formatTime(currentMatch.date)}
                </div>
              </div>
            </div>

            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(currentMatch.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{currentMatch.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Trophy className="h-4 w-4" />
                <span>{currentMatch.competition}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Match Events Timeline
              {currentMatch.events.length > 0 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium ml-2">
                  {currentMatch.events.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentMatch.events.length > 0 ? (
              <div className="space-y-3">
                {currentMatch.events
                  .sort((a, b) => a.minute - b.minute)
                  .map((event, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-medium text-gray-500 w-12 text-right">
                        {event.minute}'
                      </span>
                      <span className={`text-lg ${getEventColor(event.eventType)}`}>
                        {getEventIcon(event.eventType)}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {event.player}
                        </span>
                        <span className="text-gray-600 ml-2">
                          ({event.team === 'teamA' ? currentMatch.teamA : currentMatch.teamB})
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {event.eventType.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {currentMatch.status === 'pending' 
                  ? 'Match has not started yet'
                  : currentMatch.status === 'ongoing'
                  ? 'No events recorded yet'
                  : 'No events were recorded in this match'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info based on match status */}
        {currentMatch.status === 'pending' && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Upcoming Match</h3>
              <p className="text-gray-600">
                This match is scheduled to start at {formatTime(currentMatch.date)} on {formatDate(currentMatch.date)}. 
                Check back later for live updates and commentary.
              </p>
            </CardContent>
          </Card>
        )}

        {currentMatch.status === 'finished' && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Match Result</h3>
              <p className="text-gray-600">
                The match ended {currentMatch.scoreA} - {currentMatch.scoreB}. 
                {currentMatch.scoreA > currentMatch.scoreB 
                  ? ` ${currentMatch.teamA} won the match.`
                  : currentMatch.scoreB > currentMatch.scoreA
                  ? ` ${currentMatch.teamB} won the match.`
                  : ' The match ended in a draw.'}
              </p>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}

// Server component that handles the async params
export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;

  return <MatchDetailContent matchId={matchId} />;
}