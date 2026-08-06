// server.js
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;

// 1. Create a standard HTTP Web Server first
const server = createServer((req, res) => {
    // If an external service visits your site path /ping, reply with "OK"
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

// 2. Attach your WebSocket Server to that HTTP server
const wss = new WebSocketServer({ server });
const clients = new Set();
let historyLog = [];

wss.on('connection', (ws) => {
    clients.add(ws);
    if (historyLog.length > 0) {
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        const messageText = data.toString();
        const parsedMessage = JSON.parse(messageText);
        historyLog.push(parsedMessage);

        if (historyLog.length > 50) { historyLog.shift(); }
        broadcastMessage(parsedMessage);
    });

    ws.on('close', () => { clients.delete(ws); });
});

function broadcastMessage(messageObject) {
    for (let client of clients) {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'message', data: messageObject }));
        }
    }
}

// Start the unified server setup
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
