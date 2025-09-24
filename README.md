# Kommo WhatsApp Notifier 🔔

Real-time notification system that receives Kommo CRM webhooks, filters messages from the WhatsApp Lite channel, and shows pop-up (toast) notifications on the frontend via WebSocket.

**Architecture:** Kommo (webhook) → POST /webhook → channel filter → WebSocket broadcast (/ws) → client.js (toasts) → user sees popup.

## 📋 Descrição

Este serviço recebe webhooks do Kommo CRM para eventos `message.received`, filtra apenas mensagens do canal WhatsApp e as transmite em tempo real via WebSocket para clientes conectados que exibem notificações toast.

## 🚀 Funcionalidades

- ✅ **Webhook Endpoint** (`POST /webhook`) - Recebe eventos do Kommo CRM
- ✅ **Filtragem Inteligente** - Processa apenas eventos `type === "message.received"` 
- ✅ **Filtro de Canal** - Apenas mensagens onde `event.data.channel === WHATSAPP_CHANNEL_KEY`
- ✅ **WebSocket em Tempo Real** - Broadcasting via WebSocket em `/ws`
- ✅ **Notificações Toast** - Cliente JavaScript com pop-ups automáticos
- ✅ **Verificação de Assinatura** - HMAC SHA256 opcional para segurança
- ✅ **Variáveis de Ambiente** - Configuração flexível

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos
1. Clone o repositório
```bash
git clone https://github.com/RigolizzoB4/-kommo-whatsapp-notifier-.git
cd -kommo-whatsapp-notifier-
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente (opcional)
```bash
export WHATSAPP_CHANNEL_KEY=whatsapp_lite
export WEBHOOK_SECRET=your_secret_key
export PORT=3000
```

4. Inicie o servidor
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)
- `WHATSAPP_CHANNEL_KEY`: Canal WhatsApp a filtrar (padrão: whatsapp_lite)
- `WEBHOOK_SECRET`: Chave secreta para verificação HMAC SHA256 (opcional)

### Exemplo
```bash
WHATSAPP_CHANNEL_KEY=whatsapp_lite WEBHOOK_SECRET=my_secret PORT=8080 npm start
```

## 📡 API Endpoints

### POST /webhook
Recebe eventos do Kommo CRM e filtra mensagens do WhatsApp.

**Critérios de Filtragem:**
- `event.type === "message.received"` ✓
- `event.data.channel === WHATSAPP_CHANNEL_KEY` ✓

**Payload esperado:**
```json
{
  "type": "message.received", 
  "data": {
    "id": "12345",
    "from": "João Silva", 
    "text": "Mensagem do cliente",
    "channel": "whatsapp_lite",
    "timestamp": 1632150000000
  }
}
```

**Respostas:**
- ✅ `200 { "status": "ok", "received": true }` - Mensagem processada
- 🔍 `200 { "filtered_out": true }` - Canal incorreto
- ❌ `200 { "ignored": true }` - Tipo de evento incorreto
- 🔐 `401 { "error": "Unauthorized: Invalid signature" }` - Assinatura inválida

**Verificação de Assinatura (Opcional):**
Se `WEBHOOK_SECRET` estiver configurado:
- Compute HMAC SHA256 do JSON body
- Compare com header `x-signature`
- Retorna 401 se não coincidir

### GET /health
Retorna status do servidor e clientes conectados.

### GET /
Informações sobre o serviço e configuração.

### WebSocket /ws
Conecte-se para receber mensagens em tempo real.

**URL:** `ws://localhost:3000/ws`

**Mensagens recebidas:**
```json
// Mensagem de boas-vindas
{ "type": "welcome", "ts": 1632150000000 }

// Mensagem do WhatsApp  
{
  "type": "whatsapp_message",
  "data": {
    "id": "12345",
    "from": "João Silva", 
    "text": "Mensagem do cliente",
    "at": 1632150000000
  }
}
```

## 🎯 Cliente JavaScript (Toast Notifications)

### Uso Básico
```html
<script src="client.js"></script>
<script>
  // Inicialização automática - as notificações toast aparecerão automaticamente
</script>
```

### Uso Avançado
```javascript
const notifier = new KommoWhatsAppNotifier('ws://localhost:3000/ws');

// As notificações aparecerão automaticamente no canto superior direito
// Personalizar comportamento se necessário:
notifier.showToast('Título', 'Mensagem', 'success', 5000);
```

## 🧪 Demonstração e Teste

### 1. Interface de Demonstração
Acesse `http://localhost:3000/demo.html` para:
- ✅ Ver status da conexão WebSocket
- ✅ Enviar mensagens de teste
- ✅ Visualizar notificações toast em tempo real

### 2. Interface de Teste Técnico  
Acesse `http://localhost:3000/test-client.html` para:
- ✅ Testar conectividade WebSocket
- ✅ Ver logs detalhados
- ✅ Enviar payloads customizados

### 3. Teste via cURL

**Mensagem WhatsApp (será processada):**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"type":"message.received","data":{"id":"12345","from":"João Silva","text":"Olá!","channel":"whatsapp_lite","timestamp":1632150000000}}' \
  http://localhost:3000/webhook
```

**Mensagem de outro canal (será filtrada):**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"type":"message.received","data":{"id":"54321","from":"Maria","text":"Email","channel":"email","timestamp":1632150000000}}' \
  http://localhost:3000/webhook
```

**Com verificação de assinatura:**
```bash
# Calcular HMAC SHA256
SIGNATURE=$(echo -n '{"type":"message.received","data":{"id":"test"}}' | openssl dgst -sha256 -hmac "your_secret" -hex | cut -d' ' -f2)

curl -X POST -H "Content-Type: application/json" -H "x-signature: $SIGNATURE" \
  -d '{"type":"message.received","data":{"id":"test"}}' \
  http://localhost:3000/webhook
```

## 📊 Configuração no Kommo CRM

1. Acesse as configurações de Webhooks no Kommo CRM
2. Configure o endpoint: `http://seu-servidor:3000/webhook`
3. Selecione o evento: `message.received`
4. Configure o canal como `whatsapp_lite` (ou seu valor de `WHATSAPP_CHANNEL_KEY`)
5. (Opcional) Configure assinatura HMAC SHA256 com sua `WEBHOOK_SECRET`
6. Salve a configuração

## 🛠️ Desenvolvimento

### Scripts
- `npm start`: Inicia o servidor
- `npm run dev`: Inicia o servidor (mesmo que start)

### Estrutura do Projeto
```
├── index.js              # Servidor principal (Express + WebSocket)
├── client.js             # Cliente JavaScript para toast notifications  
├── demo.html             # Interface de demonstração
├── test-client.html      # Interface de teste técnico
├── package.json          # Configurações e dependências
└── README.md            # Documentação
```

### Fluxo de Dados
```
Kommo CRM → POST /webhook → Filtros → WebSocket /ws → client.js → Toast Popup
```

## 📄 Licença

ISC
