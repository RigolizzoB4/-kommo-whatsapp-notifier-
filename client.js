/**
 * Kommo WhatsApp Notifier Client
 * Connects to WebSocket and shows toast notifications for WhatsApp messages
 */

class KommoWhatsAppNotifier {
  constructor(wsUrl) {
    this.wsUrl = wsUrl || `ws://${window.location.host}/ws`;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.init();
  }

  init() {
    this.createToastContainer();
    this.connect();
  }

  createToastContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        width: 350px;
        max-width: 90vw;
      `;
      document.body.appendChild(container);
    }
  }

  connect() {
    console.log('Connecting to WhatsApp notifier...');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to WhatsApp notifier');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WhatsApp notifier');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        console.log('Welcome message received');
        this.showToast('🔔 WhatsApp Notifier Connected', 'Connected to real-time notifications', 'success');
        break;
      
      case 'whatsapp_message':
        this.showWhatsAppToast(data.data);
        break;
      
      default:
        console.log('Unknown message type:', data);
    }
  }

  showWhatsAppToast(messageData) {
    const { id, from, text, at } = messageData;
    const timestamp = new Date(at).toLocaleTimeString();
    
    this.showToast(
      `💬 ${from}`,
      `${text}\n${timestamp}`,
      'whatsapp',
      7000 // Show for 7 seconds
    );
  }

  showToast(title, message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      whatsapp: '#25d366'
    };

    toast.style.cssText = `
      background: white;
      border-left: 4px solid ${colors[type] || colors.info};
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin-bottom: 10px;
      padding: 15px;
      position: relative;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      word-wrap: break-word;
    `;

    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px; color: #333;">
        ${this.escapeHtml(title)}
      </div>
      <div style="color: #666; white-space: pre-line; line-height: 1.4;">
        ${this.escapeHtml(message)}
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">&times;</button>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  }

  removeToast(toast) {
    if (toast.parentElement) {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.showToast('❌ Connection Lost', 'Failed to reconnect to WhatsApp notifier', 'error');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.kommoNotifier = new KommoWhatsAppNotifier();
    });
  } else {
    window.kommoNotifier = new KommoWhatsAppNotifier();
  }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KommoWhatsAppNotifier;
}