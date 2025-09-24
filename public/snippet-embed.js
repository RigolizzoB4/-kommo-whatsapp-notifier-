/**
 * Kommo WhatsApp Notifier - Embeddable Snippet
 * 
 * This script can be embedded on any website to receive WhatsApp notifications.
 * 
 * Usage:
 * <script src="https://your-domain.com/snippet-embed.js"></script>
 * 
 * To override the host (if serving from different domain):
 * <script>
 *   window.KOMMO_NOTIFIER_HOST = 'wss://your-websocket-server.com';
 * </script>
 * <script src="https://your-domain.com/snippet-embed.js"></script>
 */

(function() {
  'use strict';

  // Configuration - can be overridden by setting window.KOMMO_NOTIFIER_HOST
  const getWebSocketUrl = () => {
    if (window.KOMMO_NOTIFIER_HOST) {
      return window.KOMMO_NOTIFIER_HOST + '/ws';
    }
    
    // Default to current domain
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  };

  // Minimal toast notification system
  class KommoEmbedNotifier {
    constructor() {
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 2000;
      this.toastDuration = 6000;
      
      this.init();
    }

    init() {
      this.createToastContainer();
      this.connect();
    }

    createToastContainer() {
      if (document.getElementById('kommo-embed-toast-container')) return;
      
      const container = document.createElement('div');
      container.id = 'kommo-embed-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        width: 320px;
        max-width: 90vw;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      // Add CSS styles
      if (!document.getElementById('kommo-embed-styles')) {
        const style = document.createElement('style');
        style.id = 'kommo-embed-styles';
        style.textContent = `
          @keyframes kommoSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes kommoSlideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
          .kommo-embed-toast {
            animation: kommoSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .kommo-embed-toast.removing {
            animation: kommoSlideOut 0.3s ease-in-out;
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(container);
    }

    connect() {
      try {
        const wsUrl = getWebSocketUrl();
        console.log('Kommo Notifier: Connecting to', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Kommo Notifier: Connected');
          this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Kommo Notifier: Error parsing message', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Kommo Notifier: Disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Kommo Notifier: WebSocket error', error);
        };
      } catch (error) {
        console.error('Kommo Notifier: Failed to connect', error);
      }
    }

    handleMessage(data) {
      if (data.type === 'whatsapp_message') {
        this.showWhatsAppToast(data.data);
      }
    }

    showWhatsAppToast(messageData) {
      const { from, text, at } = messageData;
      const timestamp = new Date(at).toLocaleTimeString();
      
      const toast = document.createElement('div');
      toast.className = 'kommo-embed-toast';
      toast.style.cssText = `
        background: white;
        border-left: 4px solid #25d366;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        margin-bottom: 12px;
        padding: 16px;
        position: relative;
        pointer-events: auto;
        max-width: 100%;
        font-size: 14px;
        line-height: 1.4;
      `;

      toast.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: #333;">
          💬 ${this.escapeHtml(from)}
        </div>
        <div style="color: #666; margin-bottom: 8px;">
          ${this.escapeHtml(text)}
        </div>
        <div style="color: #999; font-size: 12px;">
          ${timestamp}
        </div>
        <button onclick="this.parentElement.remove()" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          padding: 4px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        " onmouseover="this.style.backgroundColor='#f5f5f5';" 
           onmouseout="this.style.backgroundColor='transparent';">&times;</button>
      `;

      const container = document.getElementById('kommo-embed-toast-container');
      container.appendChild(toast);

      // Auto remove
      setTimeout(() => {
        if (toast.parentElement) {
          toast.classList.add('removing');
          setTimeout(() => {
            if (toast.parentElement) {
              toast.remove();
            }
          }, 300);
        }
      }, this.toastDuration);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    attemptReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Kommo Notifier: Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.error('Kommo Notifier: Max reconnection attempts reached');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.kommoEmbedNotifier = new KommoEmbedNotifier();
    });
  } else {
    window.kommoEmbedNotifier = new KommoEmbedNotifier();
  }

})();