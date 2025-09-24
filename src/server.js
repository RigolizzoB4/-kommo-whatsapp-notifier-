import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeWebSocket, getConnectedClientsCount } from './websocket.js';
import { handleWebhook } from './webhook.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = initializeWebSocket(server);

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Webhook endpoint
app.post('/webhook', handleWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedClients: getConnectedClientsCount(),
    config: {
      whatsapp_channel: process.env.WHATSAPP_CHANNEL_KEY || 'whatsapp_lite',
      signature_verification: !!process.env.WEBHOOK_SECRET,
      allowed_origins: allowedOrigins
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Kommo WhatsApp Notifier',
    description: 'Real-time notification system for Kommo CRM WhatsApp messages',
    version: '1.0.0',
    endpoints: {
      webhook: 'POST /webhook',
      health: 'GET /health',
      websocket: 'WS /ws'
    },
    config: {
      whatsapp_channel: process.env.WHATSAPP_CHANNEL_KEY || 'whatsapp_lite',
      signature_verification: !!process.env.WEBHOOK_SECRET,
      allowed_origins: allowedOrigins
    },
    connectedClients: getConnectedClientsCount()
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 WebSocket server ready at /ws`);
  console.log(`🔗 Webhook endpoint: http://localhost:${port}/webhook`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📱 WhatsApp channel: ${process.env.WHATSAPP_CHANNEL_KEY || 'whatsapp_lite'}`);
  console.log(`🔐 Signature verification: ${process.env.WEBHOOK_SECRET ? 'enabled' : 'disabled'}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
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