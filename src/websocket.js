import { WebSocketServer } from 'ws';

// Store connected WebSocket clients
const clients = new Set();

export function initializeWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    // Send welcome message
    const welcomeMessage = {
      type: 'welcome',
      ts: Date.now()
    };
    ws.send(JSON.stringify(welcomeMessage));

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

export function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  console.log(`Broadcasting to ${clients.size} clients:`, messageStr);
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('Error sending message to client:', error);
        clients.delete(client);
      }
    }
  });
}

export function getConnectedClientsCount() {
  return clients.size;
}