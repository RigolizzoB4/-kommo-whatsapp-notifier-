class KommoNotifier {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.messages = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        
        this.initializeElements();
        this.bindEvents();
        this.autoConnect();
    }

    initializeElements() {
        // Status elements
        this.connectionStatus = document.getElementById('connection-status');
        this.lastPing = document.getElementById('last-ping');
        
        // Controls
        this.connectBtn = document.getElementById('connect-btn');
        this.testBtn = document.getElementById('test-btn');
        this.clearBtn = document.getElementById('clear-btn');
        
        // Messages
        this.messagesContainer = document.getElementById('messages-container');
        
        // Notification popup
        this.notificationPopup = document.getElementById('notification-popup');
        this.closePopupBtn = document.getElementById('close-popup');
        this.openChatBtn = document.getElementById('open-chat-btn');
        this.dismissBtn = document.getElementById('dismiss-btn');
        this.notificationSound = document.getElementById('notification-sound');
        
        // Popup content elements
        this.popupContactName = document.getElementById('popup-contact-name');
        this.popupContactPhone = document.getElementById('popup-contact-phone');
        this.popupMessageText = document.getElementById('popup-message-text');
        this.popupTimestamp = document.getElementById('popup-timestamp');
    }

    bindEvents() {
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        this.testBtn.addEventListener('click', () => this.sendTestNotification());
        this.clearBtn.addEventListener('click', () => this.clearMessages());
        
        // Popup controls
        this.closePopupBtn.addEventListener('click', () => this.hideNotification());
        this.dismissBtn.addEventListener('click', () => this.hideNotification());
        this.openChatBtn.addEventListener('click', () => this.openKommoChat());
        
        // Auto-hide notification after 10 seconds
        this.notificationTimeout = null;
    }

    autoConnect() {
        // Automatically connect when page loads
        setTimeout(() => this.connect(), 1000);
    }

    connect() {
        if (this.isConnected) {
            this.disconnect();
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocketEvents();
            this.updateConnectionStatus('Conectando...', 'connecting');
            this.connectBtn.textContent = 'Conectando...';
            this.connectBtn.disabled = true;
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            this.updateConnectionStatus('Erro de conexão', 'offline');
            this.scheduleReconnect();
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('Desconectado', 'offline');
        this.connectBtn.textContent = 'Conectar';
        this.connectBtn.disabled = false;
    }

    setupWebSocketEvents() {
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('Conectado', 'online');
            this.connectBtn.textContent = 'Desconectar';
            this.connectBtn.disabled = false;
            this.updateLastPing();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
                this.updateLastPing();
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            this.isConnected = false;
            this.updateConnectionStatus('Desconectado', 'offline');
            this.connectBtn.textContent = 'Conectar';
            this.connectBtn.disabled = false;
            
            // Attempt to reconnect if not manually disconnected
            if (event.code !== 1000) {
                this.scheduleReconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('Erro de conexão', 'offline');
        };
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, this.reconnectInterval);
        } else {
            console.log('Max reconnection attempts reached');
            this.updateConnectionStatus('Falha na reconexão', 'offline');
        }
    }

    handleMessage(message) {
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'connection':
                console.log('Connection confirmed:', message.message);
                break;
                
            case 'whatsapp_message':
                this.handleWhatsAppMessage(message);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    handleWhatsAppMessage(message) {
        const messageData = message.data;
        
        // Add to messages list
        this.messages.unshift({
            ...messageData,
            receivedAt: new Date()
        });
        
        // Update messages display
        this.updateMessagesDisplay();
        
        // Show notification popup
        this.showNotification(messageData);
        
        // Play notification sound
        this.playNotificationSound();
    }

    showNotification(messageData) {
        // Update popup content
        this.popupContactName.textContent = messageData.contact.name || 'Contato Desconhecido';
        this.popupContactPhone.textContent = messageData.contact.phone || '';
        this.popupMessageText.textContent = messageData.message.text || 'Mensagem sem texto';
        this.popupTimestamp.textContent = this.formatTimestamp(messageData.message.timestamp);
        
        // Store lead URL for opening chat
        this.currentLeadUrl = messageData.lead?.url;
        this.openChatBtn.style.display = this.currentLeadUrl ? 'inline-flex' : 'none';
        
        // Show popup
        this.notificationPopup.classList.remove('hidden');
        setTimeout(() => {
            this.notificationPopup.classList.add('show');
        }, 100);
        
        // Auto-hide after 10 seconds
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 10000);
        
        // Request notification permission and show browser notification
        this.showBrowserNotification(messageData);
    }

    hideNotification() {
        this.notificationPopup.classList.remove('show');
        setTimeout(() => {
            this.notificationPopup.classList.add('hidden');
        }, 300);
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
    }

    openKommoChat() {
        if (this.currentLeadUrl) {
            window.open(this.currentLeadUrl, '_blank');
        }
        this.hideNotification();
    }

    playNotificationSound() {
        try {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(error => {
                console.log('Could not play notification sound:', error);
            });
        } catch (error) {
            console.log('Error playing notification sound:', error);
        }
    }

    showBrowserNotification(messageData) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(`Nova mensagem WhatsApp - ${messageData.contact.name}`, {
                    body: messageData.message.text,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2325D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.484 3.516z"/></svg>',
                    tag: 'whatsapp-message'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.showBrowserNotification(messageData);
                    }
                });
            }
        }
    }

    updateMessagesDisplay() {
        if (this.messages.length === 0) {
            this.messagesContainer.innerHTML = '<p class="no-messages">Nenhuma mensagem recebida ainda. Aguardando notificações...</p>';
            return;
        }

        const messagesHtml = this.messages.map((message, index) => {
            const isNew = index === 0;
            return this.createMessageElement(message, isNew);
        }).join('');

        this.messagesContainer.innerHTML = messagesHtml;
    }

    createMessageElement(message, isNew = false) {
        const timestamp = this.formatTimestamp(message.message.timestamp);
        const receivedAt = this.formatTimestamp(message.receivedAt);
        const newClass = isNew ? 'new' : '';
        
        const chatButton = message.lead?.url ? 
            `<button class="btn btn-primary btn-small" onclick="window.open('${message.lead.url}', '_blank')">
                🚀 Abrir Chat
            </button>` : '';

        return `
            <div class="message-item ${newClass}">
                <div class="message-header">
                    <span class="contact-name">
                        💬 ${message.contact.name || 'Contato Desconhecido'}
                        ${message.contact.phone ? `(${message.contact.phone})` : ''}
                    </span>
                    <span class="message-time">${receivedAt}</span>
                </div>
                <div class="message-text">
                    ${message.message.text || 'Mensagem sem texto'}
                </div>
                <div class="message-actions">
                    ${chatButton}
                    <small style="color: #999;">Mensagem enviada: ${timestamp}</small>
                </div>
            </div>
        `;
    }

    toggleConnection() {
        if (this.isConnected) {
            this.disconnect();
        } else {
            this.connect();
        }
    }

    async sendTestNotification() {
        if (!this.isConnected) {
            alert('Conecte-se ao servidor primeiro!');
            return;
        }

        try {
            const response = await fetch('/test/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'message',
                    contact: {
                        id: Math.floor(Math.random() * 10000),
                        name: 'Contato de Teste',
                        phone: '+5511999999999'
                    },
                    message: {
                        id: Math.floor(Math.random() * 10000),
                        text: `Mensagem de teste enviada em ${new Date().toLocaleString('pt-BR')}`,
                        created_at: new Date().toISOString()
                    },
                    lead: {
                        id: Math.floor(Math.random() * 10000),
                        name: 'Lead de Teste'
                    }
                })
            });

            if (response.ok) {
                console.log('Test notification sent successfully');
            } else {
                console.error('Failed to send test notification');
                alert('Erro ao enviar notificação de teste');
            }
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('Erro ao enviar notificação de teste');
        }
    }

    clearMessages() {
        if (confirm('Tem certeza que deseja limpar todo o histórico de mensagens?')) {
            this.messages = [];
            this.updateMessagesDisplay();
        }
    }

    updateConnectionStatus(status, className) {
        this.connectionStatus.textContent = status;
        this.connectionStatus.className = `status-value ${className}`;
    }

    updateLastPing() {
        this.lastPing.textContent = new Date().toLocaleTimeString('pt-BR');
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'agora mesmo';
        } else if (diffMins < 60) {
            return `há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
        } else {
            return date.toLocaleString('pt-BR');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kommoNotifier = new KommoNotifier();
    
    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});