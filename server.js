// server.js
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;

// 🔒 CHOOSE YOUR MASTER PASSWORD HERE
const ADMIN_PASSWORD = "MySecretAdminPassword123"; 

const server = createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    } else {
        res.writeHead(404); res.end();
    }
});

const wss = new WebSocketServer({ server });
const clients = new Set();
let historyLog = [];

wss.on('connection', (ws) => {
    clients.add(ws);
    
    if (historyLog.length > 0) {
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        const incoming = JSON.parse(data.toString());

        // A. Handle structural Admin wipe signals
        if (incoming.type === 'wipe') {
            if (incoming.adminSecret === ADMIN_PASSWORD) {
                historyLog = []; // Flush memory bank
                broadcastToAll({ type: 'wipe' });
                console.log("⚠️ Core chat logs wiped completely by an authorized admin connection.");
            } else {
                console.log("❌ Unauthorized clear room attempt rejected.");
            }
        } 
        // B. Handle typical message payloads
        else if (incoming.type === 'message') {
            historyLog.push(incoming);
            if (historyLog.length > 50) historyLog.shift();
            broadcastToAll({ type: 'message', data: incoming });
        }
    });

    ws.on('close', () => { clients.delete(ws); });
});

function broadcastToAll(obj) {
    for (let client of clients) {
        if (client.readyState === 1) {
            client.send(JSON.stringify(obj));
        }
    }
}

server.listen(PORT, () => {
    console.log(`Ultimate server running on port ${PORT}`);
});
