require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket Server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
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

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Kommo WhatsApp notification service'
  }));
});

// Function to broadcast message to all connected clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
  
  console.log(`Broadcasted message to ${clients.size} clients:`, message);
}

// Webhook endpoint for Kommo CRM
app.post('/webhook/kommo', (req, res) => {
  try {
    console.log('Received webhook from Kommo:', JSON.stringify(req.body, null, 2));
    
    // Basic webhook validation (implement proper signature validation in production)
    if (WEBHOOK_SECRET && req.headers['x-webhook-signature']) {
      // TODO: Implement proper signature validation
      console.log('Webhook signature received:', req.headers['x-webhook-signature']);
    }

    const webhookData = req.body;
    
    // Check if this is a WhatsApp Lite message event
    if (isWhatsAppMessage(webhookData)) {
      const messageData = extractMessageData(webhookData);
      
      // Broadcast to all connected WebSocket clients
      broadcastToClients({
        type: 'whatsapp_message',
        data: messageData,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({ status: 'success', message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Function to check if webhook data contains WhatsApp message
function isWhatsAppMessage(webhookData) {
  // Check for WhatsApp Lite specific indicators in the webhook data
  // This will need to be adjusted based on actual Kommo webhook structure
  if (!webhookData || !webhookData.account) {
    return false;
  }
  
  // Look for WhatsApp related events
  const eventType = webhookData.event_type || webhookData.type;
  const source = webhookData.source_name || webhookData.pipeline_name || '';
  
  return (
    eventType === 'message' || 
    eventType === 'add_message' ||
    source.toLowerCase().includes('whatsapp') ||
    (webhookData.message && webhookData.message.source === 'whatsapp')
  );
}

// Function to extract relevant message data
function extractMessageData(webhookData) {
  const data = {
    id: webhookData.id || webhookData.message?.id || Date.now(),
    contact: {
      id: null,
      name: 'Unknown Contact',
      phone: null
    },
    message: {
      text: '',
      timestamp: new Date().toISOString()
    },
    lead: {
      id: null,
      name: null,
      url: null
    }
  };

  // Extract contact information
  if (webhookData.contact) {
    data.contact.id = webhookData.contact.id;
    data.contact.name = webhookData.contact.name || 'Unknown Contact';
    data.contact.phone = webhookData.contact.phone;
  }

  // Extract message content
  if (webhookData.message) {
    data.message.text = webhookData.message.text || webhookData.message.content || '';
    data.message.timestamp = webhookData.message.created_at || webhookData.created_at || data.message.timestamp;
  }

  // Extract lead information
  if (webhookData.lead) {
    data.lead.id = webhookData.lead.id;
    data.lead.name = webhookData.lead.name;
    
    // Construct Kommo chat URL
    const kommoBaseUrl = process.env.KOMMO_BASE_URL;
    if (kommoBaseUrl && data.lead.id) {
      data.lead.url = `${kommoBaseUrl}/leads/detail/${data.lead.id}`;
    }
  }

  return data;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    clients: clients.size
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    service: 'Kommo WhatsApp Notifier',
    status: 'running',
    connectedClients: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to simulate webhook (for development)
app.post('/test/webhook', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    const testMessage = req.body || {
      event_type: 'message',
      contact: {
        id: 12345,
        name: 'Test Contact',
        phone: '+5511999999999'
      },
      message: {
        id: 67890,
        text: 'This is a test WhatsApp message',
        created_at: new Date().toISOString()
      },
      lead: {
        id: 54321,
        name: 'Test Lead'
      }
    };
    
    broadcastToClients({
      type: 'whatsapp_message',
      data: extractMessageData(testMessage),
      timestamp: new Date().toISOString()
    });
    
    res.json({ status: 'success', message: 'Test webhook sent' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Kommo WhatsApp Notifier server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook/kommo`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});