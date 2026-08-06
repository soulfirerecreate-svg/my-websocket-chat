// server.js
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();

// Array to hold the last 50 messages in the server's memory
let historyLog = [];

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`Connected. Total: ${clients.size}`);

    // Instantly send the existing chat history to the newly connected user
    if (historyLog.length > 0) {
        ws.send(JSON.stringify({ type: 'history', data: historyLog }));
    }

    ws.on('message', (data) => {
        const messageText = data.toString();
        const parsedMessage = JSON.parse(messageText);

        // Add the new message to our server memory log
        historyLog.push(parsedMessage);

        // Keep the history capped at the last 50 messages
        if (historyLog.length > 50) {
            historyLog.shift(); 
        }

        // Broadcast the message package out to everyone
        broadcastMessage(parsedMessage);
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Helper function to safely send a message package to every connected browser tab
function broadcastMessage(messageObject) {
    for (let client of clients) {
        if (client.readyState === 1) { // 1 means connection is active
            client.send(JSON.stringify({ type: 'message', data: messageObject }));
        }
    }
}

// ⏰ AUTOMATED KEEP-ALIVE SYSTEM HEARTBEAT
// 10 minutes = 10 minutes * 60 seconds * 1000 milliseconds = 600000 ms
setInterval(() => {
    
    // 1. Create a fake automated system message layout
    const pingMessage = {
        senderId: "System_Bot",
        text: "⚙️ System Check: Connection stable. Server is awake!"
    };

    // 2. Save it to the server's running history log
    historyLog.push(pingMessage);
    if (historyLog.length > 50) {
        historyLog.shift();
    }

    // 3. Broadcast it to any users who happen to be looking at the chat screen
    broadcastMessage(pingMessage);
    
    console.log("Sent automated 10-minute heartbeat to keep the cloud server awake.");

}, 600000); 

console.log(`WebSocket server running on port ${PORT}`);
