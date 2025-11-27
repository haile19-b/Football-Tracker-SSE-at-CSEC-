// app/admin/matches/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Clock, Play, Square, Loader2 } from "lucide-react";
import { useMatchSSE } from "@/hooks/useMatchSSE";
import { matchAPI, CreateMatchData } from "@/lib/api";

export default function AdminMatchesPage() {
  const { matches, isConnected } = useMatchSSE();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMatch, setNewMatch] = useState<CreateMatchData>({
    teamA: "",
    teamB: "",
    location: "",
    competition: "",
    date: "",
  });

  const handleAddMatch = async () => {
    if (!newMatch.teamA || !newMatch.teamB || !newMatch.location || !newMatch.competition || !newMatch.date) {
      alert("Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      await matchAPI.createMatch(newMatch);
      setNewMatch({
        teamA: "",
        teamB: "",
        location: "",
        competition: "",
        date: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error creating match');
    } finally {
      setIsLoading(false);
    }
  };

  const startMatch = async (matchId: string) => {
    try {
      await matchAPI.startMatch(matchId);
    } catch (error) {
      console.error('Error starting match:', error);
      alert('Error starting match');
    }
  };

  const finishMatch = async (matchId: string) => {
    try {
      await matchAPI.changeMatchStatus(matchId, 'finished');
    } catch (error) {
      console.error('Error finishing match:', error);
      alert('Error finishing match');
    }
  };

  const getStatusDisplay = (match: any) => {
    switch (match.status) {
      case 'pending':
        return { 
          text: new Date(match.date).toLocaleDateString(), 
          color: 'text-blue-600', 
          bg: 'bg-blue-100' 
        };
      case 'ongoing':
        return { 
          text: `Live ${match.time}'`, 
          color: 'text-red-600', 
          bg: 'bg-red-100' 
        };
      case 'finished':
        return { 
          text: 'FT', 
          color: 'text-green-600', 
          bg: 'bg-green-100' 
        };
      default:
        return { text: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin - Match Management</h1>
            <p className="text-gray-600 mt-2">
              {isConnected ? '🟢 Connected to live updates' : '🔴 Disconnected'}
            </p>
          </div>
          
          {/* Add Match Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-green-50">
              <DialogHeader>
                <DialogTitle>Add New Match</DialogTitle>
                <DialogDescription>
                  Create a new football match. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamA" className="text-right">
                    Team A
                  </Label>
                  <Input
                    id="teamA"
                    value={newMatch.teamA}
                    onChange={(e) => setNewMatch({...newMatch, teamA: e.target.value})}
                    className="col-span-3"
                    placeholder="Home team"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamB" className="text-right">
                    Team B
                  </Label>
                  <Input
                    id="teamB"
                    value={newMatch.teamB}
                    onChange={(e) => setNewMatch({...newMatch, teamB: e.target.value})}
                    className="col-span-3"
                    placeholder="Away team"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({...newMatch, location: e.target.value})}
                    className="col-span-3"
                    placeholder="Stadium"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="competition" className="text-right">
                    Competition
                  </Label>
                  <Input
                    id="competition"
                    value={newMatch.competition}
                    onChange={(e) => setNewMatch({...newMatch, competition: e.target.value})}
                    className="col-span-3"
                    placeholder="League name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  onClick={handleAddMatch}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Match
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => {
            const statusInfo = getStatusDisplay(match);
            
            return (
              <Card key={match._id} className="border-l-4 border-l-gray-300">
                <CardContent className="p-6">
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-2">
                        {match.teamA} vs {match.teamB}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {match.competition} • {match.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {match.scoreA} - {match.scoreB}
                      </div>
                      <div className="text-xs text-gray-500">ID: {match._id.slice(-6)}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {match.status === 'pending' && (
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1 flex-1"
                        onClick={() => startMatch(match._id)}
                      >
                        <Play className="h-3 w-3" />
                        Start Match
                      </Button>
                    )}
                    
                    {match.status === 'ongoing' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex items-center gap-1 flex-1"
                        onClick={() => finishMatch(match._id)}
                      >
                        <Square className="h-3 w-3" />
                        End Match
                      </Button>
                    )}
                    
                    {match.status === 'finished' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        Match Ended
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <a href={`/admin/matches/${match._id}`}>
                        View
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {matches.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first match.</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" />
                    Add First Match
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}