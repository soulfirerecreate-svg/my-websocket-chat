const { createServer } = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = "MySecretAdminPassword123"; 

// Create standard HTTP Web Server
const server = createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    } else {
        res.writeHead(404); res.end();
    }
});

// 📍 PORT FIX: Explicitly bind the WebSocket listener to the root path of the active web server
const wss = new WebSocketServer({ noServer: true });
let historyLog = [];
// Intercept incoming network handshakes and feed them directly to the WebSocket channel
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    clientsAdd(ws);
    if (historyLog.length > 0) {
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        try {
            const incoming = JSON.parse(data.toString());
            if (incoming.type === 'wipe') {
                if (incoming.adminSecret === ADMIN_PASSWORD) {
                    historyLog = [];
                    broadcastToAll({ type: 'wipe' });
                }
            } 
            else if (incoming.type === 'message') {
                historyLog.push(incoming);
                if (historyLog.length > 50) historyLog.shift();
                broadcastToAll({ type: 'message', data: incoming });
            }
        } catch (e) {
            console.log("Error processing package: ", e);
        }
    });

    ws.on('close', () => { clientsDelete(ws); });
});

const activeClients = new Set();
function clientsAdd(ws) { activeClients.add(ws); }
function clientsDelete(ws) { activeClients.delete(ws); }

function broadcastToAll(obj) {
    for (let client of activeClients) {
        if (client.readyState === 1) {
            client.send(JSON.stringify(obj));
        }
    }
}

server.listen(PORT, () => {
    console.log(`WebSocket network bridge completely operational on port ${PORT}`);
});
