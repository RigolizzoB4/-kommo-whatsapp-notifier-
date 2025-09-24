import crypto from 'crypto';
import { broadcastMessage } from './websocket.js';

const WHATSAPP_CHANNEL_KEY = process.env.WHATSAPP_CHANNEL_KEY || 'whatsapp_lite';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifySignature(body, signature) {
  if (!WEBHOOK_SECRET) return true; // Skip verification if no secret set
  
  const computedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return signature && signature === computedSignature;
}

export function handleWebhook(req, res) {
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
      console.log('Event ignored - not a message.received type');
      return res.status(200).json({ ignored: true });
    }

    const eventData = req.body.data;
    
    // Filter by channel
    if (!eventData || eventData.channel !== WHATSAPP_CHANNEL_KEY) {
      console.log(`Message filtered out - channel is '${eventData?.channel}', expected '${WHATSAPP_CHANNEL_KEY}'`);
      return res.status(200).json({ filtered_out: true });
    }

    console.log('WhatsApp message detected:', eventData);
    
    // Build simplified object according to spec
    const simplifiedMessage = {
      id: eventData.id || crypto.randomUUID(),
      from: eventData.contact_name || eventData.contact_id || eventData.from || 'unknown',
      text: eventData.text || eventData.message?.text || '',
      at: eventData.timestamp || Date.now()
    };

    // Broadcast to all connected WebSocket clients
    const broadcastPayload = {
      type: 'whatsapp_message',
      data: simplifiedMessage
    };

    broadcastMessage(broadcastPayload);
    console.log('Message delivered to WebSocket clients');

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}