const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Use Maps instead of plain objects — more reliable
const waitingByTag = new Map(); // tag -> socketId
let waitingAnyId = null;        // socketId of untagged waiter

function matchUsers(socketA, socketB) {
  const room = socketA.id + '#' + socketB.id;
  socketA.join(room);
  socketB.join(room);
  socketA.room = room;
  socketB.room = room;
  socketA.emit('matched');
  socketB.emit('matched');
  console.log(`Matched: ${socketA.id} <-> ${socketB.id} in room ${room}`);
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  const broadcastCount = () => {
    io.emit('user_count', io.engine.clientsCount);
  };
  broadcastCount();

  socket.on('find_match', (tag) => {
    const interest = tag ? tag.toLowerCase().trim() : '';
    socket.interest = interest;
    console.log(`${socket.id} looking for: "${interest}"`);

    if (interest) {
      const waitingId = waitingByTag.get(interest);
      if (waitingId && waitingId !== socket.id) {
        const partnerSocket = io.sockets.sockets.get(waitingId);
        if (partnerSocket && partnerSocket.connected) {
          waitingByTag.delete(interest);
          matchUsers(socket, partnerSocket);
          return;
        } else {
          // Stale entry — clean it up
          waitingByTag.delete(interest);
        }
      }
      // No valid match found — wait
      waitingByTag.set(interest, socket.id);
      socket.emit('waiting', `Looking for someone interested in "${interest}"...`);
    } else {
      if (waitingAnyId && waitingAnyId !== socket.id) {
        const partnerSocket = io.sockets.sockets.get(waitingAnyId);
        if (partnerSocket && partnerSocket.connected) {
          waitingAnyId = null;
          matchUsers(socket, partnerSocket);
          return;
        } else {
          waitingAnyId = null;
        }
      }
      waitingAnyId = socket.id;
      socket.emit('waiting', 'Looking for a stranger...');
    }
  });

  socket.on('message', (msg) => {
    if (socket.room) {
      socket.to(socket.room).emit('message', msg);
    }
  });

  socket.on('typing', (isTyping) => {
    if (socket.room) {
      socket.to(socket.room).emit('typing', isTyping);
    }
  });

  socket.on('delete_message', (msgId) => {
    if (socket.room) {
      socket.to(socket.room).emit('delete_message', msgId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    if (waitingAnyId === socket.id) waitingAnyId = null;
    if (socket.interest && waitingByTag.get(socket.interest) === socket.id) {
      waitingByTag.delete(socket.interest);
    }
    if (socket.room) {
      socket.to(socket.room).emit('partner_left');
    }
    broadcastCount();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));