const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// ✅ Serve static files from client/build
app.use(express.static(path.resolve(__dirname, '../client/build')));

// ✅ Catch-all for React SPA
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};              // roomId => Set of sockets
const userMap = new Map();     // socket => { username, roomId }

wss.on('connection', (socket) => {
  console.log('🔌 New WebSocket client connected');

  socket.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error('Invalid JSON:', msg);
      return;
    }

    switch (data.type) {
      case 'join':
        handleJoinRoom(socket, data.roomId);
        break;
      case 'user-join':
        handleUserJoin(socket, data.username);
        break;
      case 'user-leave':
        handleUserLeave(socket);
        break;
      case 'codeChange':
        broadcastToRoom(socket, userMap.get(socket)?.roomId, {
          type: 'codeUpdate',
          code: data.code,
        }, socket);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  });

  socket.on('close', () => {
    const user = userMap.get(socket);
    if (user?.roomId && rooms[user.roomId]) {
      rooms[user.roomId].delete(socket);
      userMap.delete(socket);
      broadcastUserList(user.roomId);
    }
  });
});

function handleJoinRoom(socket, roomId) {
  if (!rooms[roomId]) rooms[roomId] = new Set();
  rooms[roomId].add(socket);
  const existing = userMap.get(socket);
  userMap.set(socket, { ...existing, roomId });
}

function handleUserJoin(socket, username) {
  const existing = userMap.get(socket);
  if (!existing?.roomId) return;
  userMap.set(socket, { ...existing, username });
  broadcastUserList(existing.roomId);
}

function handleUserLeave(socket) {
  const user = userMap.get(socket);
  if (!user?.roomId) return;
  rooms[user.roomId]?.delete(socket);
  userMap.delete(socket);
  broadcastUserList(user.roomId);
}

function broadcastUserList(roomId) {
  if (!rooms[roomId]) return;
  const users = Array.from(rooms[roomId])
    .map(sock => userMap.get(sock)?.username)
    .filter(Boolean);
  const payload = JSON.stringify({ type: 'user-list', users });
  rooms[roomId].forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastToRoom(sender, roomId, message, exclude = null) {
  const data = JSON.stringify(message);
  rooms[roomId]?.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
