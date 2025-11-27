import Match from "../model/match.model.js";
import { matchEventManager } from "../utils/eventManager.js";

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

// SSE endpoint for match list (all matches)
export const streamMatches = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial data
    const matches = await Match.find();
    res.write(`data: ${JSON.stringify({
        type: 'INITIAL_DATA',
        matches: matches
    })}\n\n`);

    // Add this client to broadcast list for all matches
    matchEventManager.addClient('all_matches', res);
}

// SSE endpoint for specific match
export const streamMatch = async (req, res) => {
    const { matchId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial match data
    const match = await Match.findById(matchId);
    if (match) {
        res.write(`data: ${JSON.stringify({
            type: 'INITIAL_MATCH_DATA',
            match: match
        })}\n\n`);
    }

    // Add this client to specific match broadcast
    matchEventManager.addClient(matchId, res);
}

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