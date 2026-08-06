// server.js
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();

// 💾 NEW: Array to hold the last 50 messages in the server's memory
let historyLog = [];

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`Connected. Total: ${clients.size}`);

    // 📥 NEW: Instantly send the existing chat history to the newly connected user
    if (historyLog.length > 0) {
        // We wrap the history log in a special "history" action type
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        const messageText = data.toString();
        const parsedMessage = JSON.parse(messageText);

        // Add the new message to our server memory log
        historyLog.push(parsedMessage);

        // Keep the history capped at the last 50 messages so the server doesn't get slow
        if (historyLog.length > 50) {
            historyLog.shift(); 
        }

        // Broadcast the message package out to everyone
        for (let client of clients) {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'message', data: parsedMessage }));
            }
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

console.log(`WebSocket server running on port ${PORT}`);
