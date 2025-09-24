/**
 * Kommo WhatsApp Notifier Client
 * Connects to WebSocket and shows toast notifications for WhatsApp messages
 */

class KommoWhatsAppNotifier {
  constructor(wsUrl, options = {}) {
    this.wsUrl = wsUrl || `ws://${window.location.host}/ws`;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.toastDuration = options.toastDuration || 6000;
    
    this.init();
  }

  init() {
    this.createToastContainer();
    this.connect();
  }

  createToastContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('kommo-toast-container')) {
      const container = document.createElement('div');
      container.id = 'kommo-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        width: 350px;
        max-width: 90vw;
        pointer-events: none;
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
      'whatsapp'
    );
  }

  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `kommo-toast kommo-toast-${type}`;
    
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
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      margin-bottom: 12px;
      padding: 16px;
      position: relative;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      word-wrap: break-word;
      pointer-events: auto;
      max-width: 100%;
      animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    toast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #333; font-size: 14px;">
        ${this.escapeHtml(title)}
      </div>
      <div style="color: #666; white-space: pre-line; line-height: 1.4; font-size: 13px;">
        ${this.escapeHtml(message)}
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      " onmouseover="this.style.backgroundColor='#f5f5f5'; this.style.color='#333';" 
         onmouseout="this.style.backgroundColor='transparent'; this.style.color='#999';">&times;</button>
    `;

    // Add CSS animation keyframes if not already added
    if (!document.getElementById('kommo-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'kommo-toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const container = document.getElementById('kommo-toast-container');
    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, this.toastDuration);
  }

  removeToast(toast) {
    if (toast.parentElement) {
      toast.style.animation = 'slideOut 0.3s ease-in-out';
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