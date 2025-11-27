// utils/eventManager.js
class MatchEventManager {
  constructor() {
    this.clients = new Map(); // matchId -> array of client responses
  }

  // Add client to specific match - FIXED VERSION
  addClient(matchId, res, req) {
    if (!this.clients.has(matchId)) {
      this.clients.set(matchId, []);
    }
    this.clients.get(matchId).push(res);
    
    // Remove client when connection closes - now using the req parameter
    if (req) {
      req.on('close', () => {
        this.removeClient(matchId, res);
      });

      // Also handle errors
      req.on('error', () => {
        this.removeClient(matchId, res);
      });
    }
  }

  // Remove client
  removeClient(matchId, res) {
    const matchClients = this.clients.get(matchId);
    if (matchClients) {
      const index = matchClients.indexOf(res);
      if (index > -1) {
        matchClients.splice(index, 1);
      }
      if (matchClients.length === 0) {
        this.clients.delete(matchId);
      }
    }
  }

  // Broadcast to all clients watching a specific match
  broadcastToMatch(matchId, data) {
    const matchClients = this.clients.get(matchId);
    if (matchClients) {
      matchClients.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.log('Error sending to client, removing...');
          this.removeClient(matchId, client);
        }
      });
    }
  }

  // Broadcast to all clients (for match list updates)
  broadcastToAll(data) {
    this.clients.forEach((clients, matchId) => {
      clients.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.log('Error sending to client, removing...');
          this.removeClient(matchId, client);
        }
      });
    });
  }
}

export const matchEventManager = new MatchEventManager();