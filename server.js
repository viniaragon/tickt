const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const dataFilePath = path.join(__dirname, 'data.json');

function loadData() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    return { items: [], selected: null };
}

function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data));
}

let data = loadData();

app.use(express.static('public'));

wss.on('connection', function connection(ws) {
    // Enviar dados atuais para o novo cliente
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
        }

        saveData(data);

        // Reenvia a mensagem para todos os clientes conectados, incluindo o cliente que fez a alteração
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

server.listen(8080, function listening() {
    console.log('Servidor WebSocket está ouvindo na porta 8080');
});