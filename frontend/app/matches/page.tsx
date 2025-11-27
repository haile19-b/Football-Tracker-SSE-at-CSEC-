// app/matches/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Trophy, Loader2 } from "lucide-react";
import { useMatchSSE } from "@/hooks/useMatchSSE";
import Link from "next/link";

export default function MatchesPage() {
  const { matches, isConnected, error, isLoading } = useMatchSSE();

  // Categorize matches based on status
  const categorizedMatches = {
    unstarted: matches.filter(match => match.status === 'pending'),
    ongoing: matches.filter(match => match.status === 'ongoing'),
    finished: matches.filter(match => match.status === 'finished')
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading matches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Football Matches</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">Live updates and match information</p>
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
            {error && (
              <p className="text-orange-600 text-sm mt-1">{error}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Matches Column */}
          <div className="space-y-4">
            <ColumnHeader 
              title="Upcoming Matches" 
              icon={<Clock className="h-5 w-5" />}
              count={categorizedMatches.unstarted.length}
            />
            {categorizedMatches.unstarted.map((match) => (
              <MatchCard key={match._id} match={match} type="unstarted" />
            ))}
            {categorizedMatches.unstarted.length === 0 && (
              <Card className="border-l-4 border-l-blue-500 bg-white">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No upcoming matches</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Matches Column */}
          <div className="space-y-4">
            <ColumnHeader 
              title="Live Matches" 
              icon={<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              count={categorizedMatches.ongoing.length}
            />
            {categorizedMatches.ongoing.map((match) => (
              <MatchCard key={match._id} match={match} type="ongoing" />
            ))}
            {categorizedMatches.ongoing.length === 0 && (
              <Card className="border-l-4 border-l-red-500 bg-white">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No live matches</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Finished Matches Column */}
          <div className="space-y-4">
            <ColumnHeader 
              title="Finished Matches" 
              icon={<Trophy className="h-5 w-5" />}
              count={categorizedMatches.finished.length}
            />
            {categorizedMatches.finished.map((match) => (
              <MatchCard key={match._id} match={match} type="finished" />
            ))}
            {categorizedMatches.finished.length === 0 && (
              <Card className="border-l-4 border-l-green-500 bg-white">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No finished matches</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Empty State - No matches at all */}
        {matches.length === 0 && !isLoading && (
          <Card className="text-center py-12 mt-8">
            <CardContent>
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Available</h3>
              <p className="text-gray-600">There are no matches scheduled at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Column Header Component
function ColumnHeader({ title, icon, count }: { title: string; icon: React.ReactNode; count: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
        {count}
      </span>
    </div>
  );
}

// Match Card Component
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
}

function MatchCard({ match, type }: { match: Match; type: 'unstarted' | 'ongoing' | 'finished' }) {
  const getTimeDisplay = () => {
    if (type === 'unstarted') {
      const date = new Date(match.date);
      return `${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })} • ${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}`;
    }
    if (type === 'ongoing') return `Live ${match.time}'`;
    return 'FT';
  };

  const getCardStyle = () => {
    switch (type) {
      case 'ongoing':
        return 'border-l-4 border-l-red-500 bg-white hover:shadow-md transition-shadow';
      case 'finished':
        return 'border-l-4 border-l-green-500 bg-white hover:shadow-md transition-shadow';
      default:
        return 'border-l-4 border-l-blue-500 bg-white hover:shadow-md transition-shadow';
    }
  };

  const getStatusColor = () => {
    switch (type) {
      case 'ongoing':
        return 'text-red-600';
      case 'finished':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Card className={getCardStyle()}>
      <CardContent className="p-4">
        {/* Teams and Score */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex-1 text-right">
            <p className="font-medium text-gray-900 truncate" title={match.teamA}>
              {match.teamA}
            </p>
          </div>
          
          <div className="mx-4 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 min-w-12 text-center">
              {match.scoreA} - {match.scoreB}
            </span>
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900 truncate" title={match.teamB}>
              {match.teamB}
            </p>
          </div>
        </div>

        {/* Competition and Location */}
        <div className="text-xs text-gray-500 text-center mb-2">
          {match.competition} • {match.location}
        </div>

        {/* Time/Status and View Button */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getTimeDisplay()}
          </span>
          <Link 
            href={`/matches/${match._id}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}