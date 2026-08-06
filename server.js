const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = "admin"; // Simple password for testing

// 1. Create a basic HTTP Server to handle the live wake-up ping
const server = createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('OK');
    } else {
        res.writeHead(404); res.end();
    }
});

// 2. Attach a WebSocket server directly to it
const wss = new WebSocketServer({ server });
const clients = new Set();
let historyLog = [];

wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Send existing chat history to the newly connected user instantly
    if (historyLog.length > 0) {
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        try {
            const incoming = JSON.parse(data.toString());

            if (incoming.type === 'wipe') {
                if (incoming.adminSecret === ADMIN_PASSWORD) {
                    historyLog = [];
                    broadcast({ type: 'wipe' });
                }
            } 
            else if (incoming.type === 'message') {
                historyLog.push(incoming);
                if (historyLog.length > 30) historyLog.shift(); // Keep history light
                broadcast({ type: 'message', data: incoming });
            }
        } catch (e) {
            console.log("Error handling packet:", e);
        }
    });

    ws.on('close', () => { clients.delete(ws); });
});

function broadcast(obj) {
    const packet = JSON.stringify(obj);
    for (let client of clients) {
        if (client.readyState === 1) { client.send(packet); }
    }
}

server.listen(PORT, () => {
    console.log(`Fresh server listening cleanly on port ${PORT}`);
});
