const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for test client)
app.use(express.static(__dirname));

// Store connected WebSocket clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast message to all connected clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  console.log(`Broadcasting to ${clients.size} clients:`, messageStr);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Webhook endpoint for Kommo CRM
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  try {
    // Check if this is a message.received event
    if (req.body && req.body.event === 'message.received') {
      const message = req.body.data;
      
      // Filter only WhatsApp Lite messages
      if (message && message.source === 'whatsapp_lite') {
        console.log('WhatsApp Lite message detected:', message);
        
        // Prepare message for broadcasting
        const broadcastMessage = {
          timestamp: new Date().toISOString(),
          event: 'whatsapp_message',
          contact: {
            id: message.contact_id || null,
            name: message.contact_name || 'Unknown'
          },
          message: {
            id: message.id || null,
            text: message.text || '',
            type: message.type || 'text'
          },
          source: message.source
        };

        // Broadcast to all connected WebSocket clients
        broadcastToClients(broadcastMessage);
      } else {
        console.log('Message filtered out - not from WhatsApp Lite');
      }
    } else {
      console.log('Event filtered out - not a message.received event');
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedClients: clients.size
  });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Kommo WhatsApp Notifier',
    description: 'Webhook receiver for Kommo CRM WhatsApp Lite messages',
    endpoints: {
      webhook: 'POST /webhook',
      health: 'GET /health',
      websocket: 'WS connection available'
    },
    connectedClients: clients.size
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});