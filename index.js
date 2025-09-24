const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;
const WHATSAPP_CHANNEL_KEY = process.env.WHATSAPP_CHANNEL_KEY || 'whatsapp_lite';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server on /ws path
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// Middleware for parsing JSON
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

// Signature verification function
function verifySignature(body, signature) {
  if (!WEBHOOK_SECRET) return true; // Skip verification if no secret set
  
  const computedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return signature && signature === computedSignature;
}

// Webhook endpoint for Kommo CRM
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  try {
    // Optional signature verification
    const signature = req.headers['x-signature'];
    if (!verifySignature(req.body, signature)) {
      console.log('Signature verification failed');
      return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    }

    // Check if this is a message.received event
    if (!req.body || req.body.type !== 'message.received') {
      console.log('Event filtered out - not a message.received type');
      return res.status(200).json({ ignored: true });
    }

    const eventData = req.body.data;
    
    // Filter by channel
    if (!eventData || eventData.channel !== WHATSAPP_CHANNEL_KEY) {
      console.log(`Message filtered out - channel is '${eventData?.channel}', expected '${WHATSAPP_CHANNEL_KEY}'`);
      return res.status(200).json({ filtered_out: true });
    }

    console.log('WhatsApp message detected:', eventData);
    
    // Build simplified object
    const simplifiedMessage = {
      id: eventData.id || crypto.randomUUID(),
      from: eventData.from || 'unknown',
      text: eventData.text || '',
      at: eventData.timestamp || Date.now()
    };

    // Broadcast to all connected WebSocket clients
    const broadcastMessage = {
      type: 'whatsapp_message',
      data: simplifiedMessage
    };

    broadcastToClients(broadcastMessage);

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
    description: 'Webhook receiver for Kommo CRM WhatsApp messages with real-time toast notifications',
    endpoints: {
      webhook: 'POST /webhook',
      health: 'GET /health',
      websocket: 'WS /ws'
    },
    config: {
      whatsapp_channel: WHATSAPP_CHANNEL_KEY,
      signature_verification: !!WEBHOOK_SECRET
    },
    connectedClients: clients.size
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 WebSocket server ready at /ws`);
  console.log(`🔗 Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📱 WhatsApp channel: ${WHATSAPP_CHANNEL_KEY}`);
  console.log(`🔐 Signature verification: ${WEBHOOK_SECRET ? 'enabled' : 'disabled'}`);
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