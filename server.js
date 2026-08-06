const { WebSocketServer } = require('ws');

// Read the port assigned by Render, default to 8080 locally
const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT });
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`Connected. Total: ${clients.size}`);

    ws.on('message', (data) => {
        const messageText = data.toString();
        for (let client of clients) {
            if (client.readyState === 1) {
                client.send(messageText);
            }
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

console.log(`WebSocket server running on port ${PORT}`);
