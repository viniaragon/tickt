const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();

// Ler os arquivos de certificado e chave
const serverOptions = {
  cert: fs.readFileSync('server.cert'),
  key: fs.readFileSync('server.key')
};

// Configuração das pastas estáticas
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'chamadaPage')));

// Criando o servidor HTTPS
const server = https.createServer(serverOptions, app);

// Criando o servidor WebSocket
const wss = new WebSocket.Server({ server });

const dataFilePath = path.join(__dirname, 'data.json');

function loadData() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  }
  return { items: [], selected: null };
}

function saveData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4)); // Formatação com espaçamento de 4
}

let data = loadData();

wss.on('connection', function connection(ws) {
  // Enviar dados iniciais para o cliente
  ws.send(JSON.stringify({ type: 'init', data }));

  ws.on('message', function incoming(message) {
    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case 'add':
        data.items.push({ text: parsedMessage.item, priority: parsedMessage.priority });
        break;
      case 'select':
        data.selected = parsedMessage.index;
        break;
      case 'deselect':
        data.selected = null;
        break;
      case 'reorder':
        data.items = parsedMessage.items;
        break;
      case 'reset':
        data = { items: [], selected: null };
        break;
      case 'remove':
        data.items = data.items.filter(item => item.text !== parsedMessage.item);
        if (data.selected !== null && data.items[data.selected] && data.items[data.selected].text === parsedMessage.item) {
          data.selected = null;
        }
        break;
      case 'call':
        const patient = parsedMessage.patient;
        const welcomeMessage = parsedMessage.message;
        // Envia o paciente chamado para todos os clientes conectados
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'call', patient, message: welcomeMessage }));
          }
        });
        break;
    }

    saveData(data);

    // Enviar dados atualizados para todos os clientes conectados
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'update', data }));
      }
    });
  });
});

// Iniciar o servidor na porta 443 (HTTPS)
server.listen(443, () => {
  console.log('Servidor HTTPS e WSS rodando na porta 443');
});
