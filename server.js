const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        // Reenvia a mensagem para todos os clientes conectados
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