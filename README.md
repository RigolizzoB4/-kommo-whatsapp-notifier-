# Kommo WhatsApp Notifier 🔔

Integração Kommo CRM + WhatsApp Lite com notificações via WebSocket

## 📋 Descrição

Este serviço recebe webhooks do Kommo CRM para eventos de mensagens recebidas, filtra apenas mensagens do WhatsApp Lite e as transmite em tempo real via WebSocket para clientes conectados.

## 🚀 Funcionalidades

- ✅ Servidor Express.js com endpoint `/webhook`
- ✅ Filtragem de mensagens do WhatsApp Lite (`source: "whatsapp_lite"`)
- ✅ Transmissão em tempo real via WebSocket
- ✅ Interface de teste para demonstração
- ✅ Health check endpoint
- ✅ Logs detalhados para debugging

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

3. Inicie o servidor
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)

### Exemplo
```bash
PORT=8080 npm start
```

## 📡 Endpoints

### POST /webhook
Recebe eventos do Kommo CRM. Filtra mensagens com `source: "whatsapp_lite"` e as transmite via WebSocket.

**Payload esperado:**
```json
{
  "event": "message.received",
  "data": {
    "id": "12345",
    "contact_id": "67890",
    "contact_name": "João Silva",
    "text": "Mensagem do cliente",
    "type": "text",
    "source": "whatsapp_lite"
  }
}
```

### GET /health
Retorna status do servidor e número de clientes conectados.

### GET /
Informações básicas sobre o serviço.

### WebSocket Connection
Conecte-se via WebSocket para receber mensagens em tempo real.

**URL:** `ws://localhost:3000`

**Formato das mensagens transmitidas:**
```json
{
  "timestamp": "2025-09-24T18:30:34.882Z",
  "event": "whatsapp_message",
  "contact": {
    "id": "67890",
    "name": "João Silva"
  },
  "message": {
    "id": "12345",
    "text": "Mensagem do cliente",
    "type": "text"
  },
  "source": "whatsapp_lite"
}
```

## 🧪 Teste

### Interface de Teste
Acesse `http://localhost:3000/test-client.html` para usar a interface de teste que permite:
- Conectar via WebSocket
- Enviar mensagens de teste
- Visualizar mensagens recebidas em tempo real

### Teste via cURL

**Enviar mensagem do WhatsApp Lite (será transmitida):**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"event":"message.received","data":{"id":"12345","contact_id":"67890","contact_name":"João Silva","text":"Olá! Teste do WhatsApp.","type":"text","source":"whatsapp_lite"}}' \
  http://localhost:3000/webhook
```

**Enviar mensagem de outro canal (será filtrada):**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"event":"message.received","data":{"id":"54321","contact_id":"98765","contact_name":"Maria Santos","text":"Mensagem de email.","type":"text","source":"email"}}' \
  http://localhost:3000/webhook
```

## 🔍 Monitoramento

O servidor registra logs detalhados incluindo:
- Conexões/desconexões de WebSocket
- Recepção de webhooks
- Filtragem de mensagens
- Transmissões para clientes

## 📊 Configuração no Kommo CRM

1. Acesse as configurações de Webhooks no Kommo CRM
2. Configure o endpoint: `http://seu-servidor:3000/webhook`
3. Selecione o evento: `message.received`
4. Salve a configuração

## 🛠️ Desenvolvimento

### Scripts disponíveis
- `npm start`: Inicia o servidor
- `npm run dev`: Inicia o servidor (mesmo que start)

### Estrutura do projeto
```
├── index.js              # Servidor principal
├── test-client.html       # Interface de teste
├── package.json          # Configurações e dependências
└── README.md            # Documentação
```

## 📄 Licença

ISC
