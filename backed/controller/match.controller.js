import Match from "../model/match.model.js";
import { matchEventManager } from "../utils/eventManager.js";

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    return res.json(matches);
  } catch (error) {
    return res.status(500).json({ 
      error: "Error fetching matches: " + error.message,
      success: false 
    });
  }
};

export const addMatch = async (req, res) => {
    const { MatchData } = req.body;

    if (!MatchData) {
        return res.status(400).json({
            error: "no match data is sent!",
            success: false
        })
    }

    const identicalMatch = await Match.findOne({
        teamA: MatchData.teamA,
        teamB: MatchData.teamB,
        date: MatchData.date
    })

    if (identicalMatch) {
        return res.status(400).json({
            error: "Identical Match is Stored on the Database!",
            success: false
        })
    }

    try {
        const StoredData = await Match.create(MatchData);

        // Broadcast new match to all connected clients
        matchEventManager.broadcastToAll({
            type: 'MATCH_ADDED',
            match: StoredData
        });

        return res.status(200).json({
            StoredData,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            error: "Error storing the match: " + error.message,
            success: false
        })
    }
}

export const getMatchById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: "Match ID is required!",
      success: false
    });
  }

  try {
    const match = await Match.findById(id);
    
    if (!match) {
      return res.status(404).json({
        error: "Match not found!",
        success: false
      });
    }

    return res.status(200).json(match);

  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message,
      success: false
    });
  }
};

export const ChangeStatusOfMatch = async (req, res) => {
    const { newStatus, MatchId } = req.body;
    
    if (!newStatus || !MatchId) {
        return res.status(400).json({
            error: "some data is missing from the request!",
            success: false
        })
    }

    try {
        const correctedMatch = await Match.findByIdAndUpdate(
            MatchId,
            { status: newStatus },
            { new: true }
        )

        if (!correctedMatch) {
            return res.status(400).json({
                error: "No Match found with given Id!",
                success: false
            })
        }

        // Broadcast status change to all clients watching this match
        matchEventManager.broadcastToMatch(MatchId, {
            type: 'MATCH_STATUS_CHANGED',
            matchId: MatchId,
            newStatus: newStatus,
            match: correctedMatch
        });

        // Also broadcast to match list viewers
        matchEventManager.broadcastToAll({
            type: 'MATCH_UPDATED',
            matchId: MatchId,
            match: correctedMatch
        });

        return res.status(200).json({
            message: "Match status is Changed successfully!",
            success: true,
            data: correctedMatch
        })

    } catch (error) {
        return res.status(500).json({
            error: "Server Error!" + error.message
        })
    }
}

export const StartTheMatch = async (req, res) => {
    const { MatchId } = req.body;

    if (!MatchId) {
        return res.status(400).json({
            error: "MatchId is required!",
            success: false
        })
    }

    try {
        const updatedMatch = await Match.findByIdAndUpdate(
            MatchId,
            { 
                status: "ongoing",
                time: 0 // Reset time when starting
            },
            { new: true }
        );

        if (!updatedMatch) {
            return res.status(400).json({
                error: "No Match found with given Id!",
                success: false
            })
        }

        // Broadcast match start to all clients
        matchEventManager.broadcastToMatch(MatchId, {
            type: 'MATCH_STARTED',
            matchId: MatchId,
            match: updatedMatch
        });

        matchEventManager.broadcastToAll({
            type: 'MATCH_UPDATED',
            matchId: MatchId,
            match: updatedMatch
        });

        return res.status(200).json({
            message: "Match started successfully!",
            success: true,
            data: updatedMatch
        });

    } catch (error) {
        return res.status(500).json({
            error: "Server Error!" + error.message
        })
    }
}

export const updateScore = async (req, res) => {
  const { matchId, scoreA, scoreB } = req.body;

  if (!matchId || scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({
      error: "Match ID and scores are required!",
      success: false
    });
  }

  try {
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { scoreA, scoreB },
      { new: true }
    );

    if (!updatedMatch) {
      return res.status(404).json({
        error: "Match not found!",
        success: false
      });
    }

    // Broadcast score update
    matchEventManager.broadcastToMatch(matchId, {
      type: 'MATCH_UPDATED',
      matchId: matchId,
      match: updatedMatch
    });

    matchEventManager.broadcastToAll({
      type: 'MATCH_UPDATED',
      matchId: matchId,
      match: updatedMatch
    });

    return res.status(200).json({
      message: "Score updated successfully!",
      success: true,
      data: updatedMatch
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error: " + error.message,
      success: false
    });
  }
};

// SSE endpoint for match list (all matches)
// In your streamMatches controller
export const streamMatches = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    console.log('New client connecting to matches stream...');

    // Send initial data
    try {
      const matches = await Match.find().sort({ createdAt: -1 });
      res.write(`data: ${JSON.stringify({
        type: 'INITIAL_DATA',
        matches: matches
      })}\n\n`);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      res.write(`data: ${JSON.stringify({
        type: 'INITIAL_DATA',
        matches: []
      })}\n\n`);
    }

    // Add this client to broadcast list - NOW PASSING req PARAMETER
    matchEventManager.addClient('all_matches', res, req);

    // Keep alive interval
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'PING' })}\n\n`);
      } catch (error) {
        clearInterval(keepAliveInterval);
      }
    }, 30000);

    // Cleanup on close
    req.on('close', () => {
      console.log('Client disconnected from matches stream');
      clearInterval(keepAliveInterval);
      matchEventManager.removeClient('all_matches', res);
    });

  } catch (error) {
    console.error('SSE setup error:', error);
    res.end();
  }
};

// Similarly for streamMatch controller
export const streamMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    console.log(`New client connecting to match ${matchId} stream...`);

    // Send initial match data
    try {
      const match = await Match.findById(matchId);
      if (match) {
        res.write(`data: ${JSON.stringify({
          type: 'INITIAL_MATCH_DATA',
          match: match
        })}\n\n`);
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
    }

    // Add this client to specific match broadcast - PASSING req PARAMETER
    matchEventManager.addClient(matchId, res, req);

    // Keep alive interval
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'PING' })}\n\n`);
      } catch (error) {
        clearInterval(keepAliveInterval);
      }
    }, 30000);

    // Cleanup on close
    req.on('close', () => {
      console.log(`Client disconnected from match ${matchId} stream`);
      clearInterval(keepAliveInterval);
      matchEventManager.removeClient(matchId, res);
    });

  } catch (error) {
    console.error('SSE match setup error:', error);
    res.end();
  }
};
// Add event to match (goals, cards, etc.)
export const addMatchEvent = async (req, res) => {
    const { matchId, eventType, team, player, minute } = req.body;

    try {
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                error: "Match not found",
                success: false
            });
        }

        // Create new event
        const newEvent = {
            eventType,
            team,
            player,
            minute
        };

        // Update scores if it's a goal
        if (eventType === 'goal') {
            if (team === 'teamA') {
                match.scoreA += 1;
            } else {
                match.scoreB += 1;
            }
        }

        // Add event to match
        match.events.push(newEvent);
        await match.save();

        // Broadcast event to all clients watching this match
        matchEventManager.broadcastToMatch(matchId, {
            type: 'MATCH_EVENT',
            matchId: matchId,
            event: newEvent,
            match: match
        });

        // Broadcast score update to match list viewers
        matchEventManager.broadcastToAll({
            type: 'MATCH_UPDATED',
            matchId: matchId,
            match: match
        });

        return res.status(200).json({
            message: "Event added successfully",
            success: true,
            data: match
        });

    } catch (error) {
        return res.status(500).json({
            error: "Server Error: " + error.message,
            success: false
        });
    }
}