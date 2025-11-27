// utils/eventManager.js
class MatchEventManager {
  constructor() {
    this.clients = new Map(); // matchId -> array of client responses
  }

  // Add client to specific match
  addClient(matchId, res) {
    if (!this.clients.has(matchId)) {
      this.clients.set(matchId, []);
    }
    this.clients.get(matchId).push(res);
    
    // Remove client when connection closes
    req.on('close', () => {
      this.removeClient(matchId, res);
    });
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
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      });
    }
  }

  // Broadcast to all clients (for match list updates)
  broadcastToAll(data) {
    this.clients.forEach((clients, matchId) => {
      clients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      });
    });
  }
}

export const matchEventManager = new MatchEventManager();