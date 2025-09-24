# 📱 Kommo WhatsApp Notifier

Sistema de notificações em tempo real para mensagens do WhatsApp Lite via Kommo CRM

## 📋 Descrição

Este projeto implementa um servidor Node.js que:
- Escuta webhooks do Kommo CRM para mensagens do WhatsApp Lite
- Encaminha notificações em tempo real via WebSocket para clientes conectados
- Fornece um widget web simples com popup de notificação e botão para abrir o chat no Kommo

## 🚀 Características

- **Servidor de Webhooks**: Recebe e processa webhooks do Kommo CRM
- **WebSocket Server**: Comunicação em tempo real com clientes conectados
- **Widget Frontend**: Interface web com notificações popup
- **Notificações do Navegador**: Suporte a notificações nativas do browser
- **Integração Kommo**: Botão direto para abrir chat no Kommo CRM
- **Histórico de Mensagens**: Visualização de mensagens recebidas
- **Som de Notificação**: Alerta sonoro para novas mensagens
- **Design Responsivo**: Interface adaptável para desktop e mobile

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd kommo-whatsapp-notifier
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
PORT=3000
NODE_ENV=development
WEBHOOK_SECRET=seu_webhook_secret_aqui
KOMMO_BASE_URL=https://sua-conta.kommo.com
KOMMO_CLIENT_ID=seu_client_id
KOMMO_CLIENT_SECRET=seu_client_secret
ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🔗 Endpoints da API

### Webhook do Kommo
- **POST** `/webhook/kommo` - Recebe webhooks do Kommo CRM
- **Headers**: `x-webhook-signature` (opcional, para validação)

### Endpoints de Status
- **GET** `/health` - Verificação de saúde do serviço
- **GET** `/status` - Status detalhado do servidor

### Desenvolvimento
- **POST** `/test/webhook` - Simula webhook para testes (apenas em desenvolvimento)

## 🌐 WebSocket

O servidor WebSocket está disponível na mesma porta do servidor HTTP.

### Mensagens WebSocket

#### Conexão
```json
{
  "type": "connection",
  "message": "Connected to Kommo WhatsApp notification service"
}
```

#### Nova Mensagem WhatsApp
```json
{
  "type": "whatsapp_message",
  "data": {
    "id": 123456,
    "contact": {
      "id": 789,
      "name": "João Silva",
      "phone": "+5511999999999"
    },
    "message": {
      "text": "Olá, preciso de ajuda!",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    "lead": {
      "id": 456,
      "name": "Lead João Silva",
      "url": "https://sua-conta.kommo.com/leads/detail/456"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 Interface Web

Acesse `http://localhost:3000` para ver a interface web que inclui:

- **Status da Conexão**: Indica se está conectado ao servidor WebSocket
- **Controles**: Botões para conectar/desconectar, testar notificação e limpar histórico
- **Histórico de Mensagens**: Lista de todas as mensagens recebidas
- **Popup de Notificação**: Notificação em tempo real com:
  - Informações do contato
  - Preview da mensagem
  - Botão para abrir chat no Kommo
  - Auto-dismiss após 10 segundos

## ⚙️ Configuração do Kommo CRM

1. Acesse as configurações de webhook no seu Kommo CRM
2. Configure a URL do webhook: `https://seu-dominio.com/webhook/kommo`
3. Selecione os eventos relacionados a mensagens do WhatsApp Lite
4. Configure o secret (opcional, mas recomendado para produção)

## 🔒 Segurança

- **CORS**: Configurado para permitir apenas origens autorizadas
- **Helmet**: Headers de segurança aplicados
- **Validação de Webhook**: Suporte a validação de assinatura (implementar em produção)
- **Rate Limiting**: Considere implementar rate limiting em produção

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
├── server.js              # Servidor principal
├── public/                # Arquivos estáticos
│   ├── index.html         # Interface web
│   ├── css/
│   │   └── style.css      # Estilos
│   └── js/
│       └── app.js         # JavaScript do frontend
├── package.json           # Dependências e scripts
├── .env.example          # Exemplo de configuração
└── README.md             # Documentação
```

### Scripts Disponíveis
- `npm start` - Inicia o servidor em produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com auto-reload

## 🐛 Solução de Problemas

### WebSocket não conecta
- Verifique se o servidor está rodando
- Confirme a configuração de CORS
- Para HTTPS, certifique-se que o WebSocket usa WSS

### Webhooks não são recebidos
- Verifique a URL do webhook no Kommo
- Confirme que o servidor está acessível externamente
- Verifique os logs do servidor para erros

### Notificações não aparecem
- Permita notificações no navegador
- Verifique se o WebSocket está conectado
- Teste com o botão "Testar Notificação"

## 📈 Monitoramento

Use os endpoints de status para monitoramento:

```bash
# Verificação básica
curl http://localhost:3000/health

# Status detalhado
curl http://localhost:3000/status
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `package.json` para mais detalhes.
