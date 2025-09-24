# Kommo WhatsApp Notifier 🔔

Real-time notification system that receives Kommo CRM webhooks, filters messages from the WhatsApp channel, and displays pop-up toast notifications on the frontend via WebSocket.

## 🏗️ Architecture

```
Kommo CRM → POST /webhook → Channel Filter → WebSocket /ws → Client Toast Notifications
```

**Flow:**
1. Kommo CRM sends webhook events to `/webhook` endpoint
2. Server filters for `message.received` events from WhatsApp channel
3. Valid messages are broadcast via WebSocket to all connected clients
4. Frontend clients display toast notifications with slide-in animations

## 🚀 Features

- **Modular Architecture**: Separated into `src/server.js`, `src/webhook.js`, and `src/websocket.js`
- **Real-time WebSocket**: Instant notifications via WebSocket at `/ws` path
- **Smart Filtering**: Only processes WhatsApp channel messages (`WHATSAPP_CHANNEL_KEY`)
- **Signature Verification**: Optional HMAC SHA256 security with `WEBHOOK_SECRET`
- **CORS Protection**: Configurable allowed origins via `ALLOWED_ORIGINS`
- **Toast Notifications**: Beautiful slide-in notifications with auto-dismiss
- **Embeddable Script**: `snippet-embed.js` for external websites
- **Auto-reconnection**: WebSocket clients automatically reconnect on disconnect

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup
```bash
# Clone repository
git clone https://github.com/RigolizzoB4/-kommo-whatsapp-notifier-.git
cd -kommo-whatsapp-notifier-

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development server
npm run dev

# Or start production server
npm start
```

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000

# CORS Configuration - comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Webhook Security (optional)
WEBHOOK_SECRET=your_webhook_secret_here

# WhatsApp Channel Filter
WHATSAPP_CHANNEL_KEY=whatsapp_lite
```

## 📡 API Endpoints

### POST /webhook
Receives Kommo CRM webhook events.

**Request Format:**
```json
{
  "type": "message.received",
  "data": {
    "id": "msg_12345",
    "contact_name": "John Doe",
    "contact_id": "contact_67890", 
    "text": "Hello from customer",
    "channel": "whatsapp_lite",
    "timestamp": 1640995200000
  }
}
```

**Responses:**
- `200 { "status": "ok", "received": true }` - Message processed and broadcast
- `200 { "filtered_out": true }` - Wrong channel, message filtered
- `200 { "ignored": true }` - Wrong event type, ignored
- `401 { "error": "Unauthorized: Invalid signature" }` - Invalid signature
- `500 { "status": "error", "message": "..." }` - Server error

**Optional Signature Verification:**
If `WEBHOOK_SECRET` is set, include HMAC SHA256 signature in `x-signature` header:
```bash
signature=$(echo -n '{"type":"message.received",...}' | openssl dgst -sha256 -hmac "your_secret" -hex)
curl -H "x-signature: $signature" -d '...' /webhook
```

### GET /health
Health check with server status.

### GET /api  
Service information and configuration.

### WebSocket /ws
Real-time message broadcasting.

**Messages Received:**
```json
// Welcome message on connection
{ "type": "welcome", "ts": 1640995200000 }

// WhatsApp message notification
{
  "type": "whatsapp_message", 
  "data": {
    "id": "msg_12345",
    "from": "John Doe",
    "text": "Hello from customer", 
    "at": 1640995200000
  }
}
```

## 🧪 Testing

### cURL Test Examples

**Send WhatsApp message (will be processed):**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.received",
    "data": {
      "id": "test_123",
      "contact_name": "Test Customer",
      "text": "Hello from WhatsApp!",
      "channel": "whatsapp_lite",
      "timestamp": '$(date +%s000)'
    }
  }'
```

**Send non-WhatsApp message (will be filtered):**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.received", 
    "data": {
      "id": "test_456",
      "contact_name": "Email Customer",
      "text": "Hello from email!",
      "channel": "email",
      "timestamp": '$(date +%s000)'
    }
  }'
```

**Test with signature verification:**
```bash
# Generate signature
payload='{"type":"message.received","data":{"id":"test","text":"hello","channel":"whatsapp_lite"}}'
signature=$(echo -n "$payload" | openssl dgst -sha256 -hmac "your_secret" -hex | cut -d' ' -f2)

curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: $signature" \
  -d "$payload"
```

### Frontend Testing

1. **Main Interface**: Visit `http://localhost:3000/` for interactive demo
2. **Test Client**: Visit `http://localhost:3000/test-client.html` for debugging
3. **WebSocket Connection**: Check browser DevTools Network tab for WebSocket `/ws`

## 🎨 Frontend Integration

### Option 1: Include Client Script
```html
<script src="http://localhost:3000/client.js"></script>
<!-- Toast notifications will appear automatically -->
```

### Option 2: Embeddable Snippet (External Sites)
```html
<!-- For same domain -->
<script src="http://localhost:3000/snippet-embed.js"></script>

<!-- For different domain -->
<script>
  window.KOMMO_NOTIFIER_HOST = 'wss://your-websocket-server.com';
</script>
<script src="http://localhost:3000/snippet-embed.js"></script>
```

### Option 3: Custom WebSocket Client
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'whatsapp_message') {
    const { from, text, at } = data.data;
    console.log(`New WhatsApp message from ${from}: ${text}`);
    // Show your custom notification
  }
};
```

## 🔧 Kommo CRM Configuration

1. Go to Kommo CRM → Settings → Webhooks
2. Add new webhook:
   - **URL**: `http://your-server:3000/webhook`  
   - **Event**: `message.received`
   - **Channel**: Configure as `whatsapp_lite` (or your `WHATSAPP_CHANNEL_KEY`)
3. Optional: Set webhook secret for signature verification
4. Save configuration

## 📁 Project Structure

```
├── src/
│   ├── server.js      # Express server + WebSocket setup
│   ├── webhook.js     # Webhook handling + filtering logic  
│   └── websocket.js   # WebSocket connection management
├── public/
│   ├── index.html     # Main demo interface
│   ├── client.js      # WebSocket client with toast notifications
│   ├── snippet-embed.js  # Embeddable script for external sites
│   └── test-client.html   # Technical testing interface
├── .env.example       # Environment variables template
├── package.json       # Dependencies and scripts
└── README.md         # This file
```

## 🚦 Development Scripts

```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start production server
npm test        # Run tests (not implemented yet)
```

## 🔮 Next Steps

1. **Database Integration**: Store message history in PostgreSQL/MongoDB
2. **User Authentication**: Add user accounts and message filtering by user
3. **Message Templates**: Support for rich message templates and attachments
4. **Analytics Dashboard**: Real-time metrics and message statistics
5. **Mobile App**: React Native app for mobile notifications
6. **Slack Integration**: Forward messages to Slack channels
7. **Email Notifications**: Fallback email notifications when WebSocket is offline
8. **Message Queueing**: Redis/Bull for reliable message processing
9. **Load Balancing**: Multiple server instances with shared WebSocket state
10. **Docker Deployment**: Containerized deployment with docker-compose

## 📜 License

ISC
