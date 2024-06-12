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
        const data = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return { items: [], selected: null };
}

function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4)); // Formatação com espaçamento de 4
}

let data = loadData();

app.use(express.static('public'));
app.use(express.static('chamadaPage'));

wss.on('connection', function connection(ws) {
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

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'update', data }));
            }
        });
    });
});

server.listen(8080, '0.0.0.0', function listening() {
    console.log('Servidor WebSocket está ouvindo na porta 8080');
});
