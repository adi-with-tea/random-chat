const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Socket.io (important for Railway)
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ✅ Serve frontend
app.use(express.static('public'));

// ✅ Root route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Storage
const waitingByTag = new Map();
let waitingAnyId = null;

// Match users
function matchUsers(socketA, socketB) {
  const room = socketA.id + '#' + socketB.id;

  socketA.join(room);
  socketB.join(room);

  socketA.room = room;
  socketB.room = room;

  socketA.emit('matched', { initiator: true });
  socketB.emit('matched', { initiator: false });

  console.log(`Matched: ${socketA.id} <-> ${socketB.id}`);
}

io.on('connection', (socket) => {

  const broadcastCount = () => {
    io.emit('user_count', io.engine.clientsCount);
  };

  broadcastCount();

  socket.on('find_match', (tag) => {
    const interest = tag ? tag.toLowerCase().trim() : '';
    socket.interest = interest;

    if (interest) {
      const waitingId = waitingByTag.get(interest);

      if (waitingId && waitingId !== socket.id) {
        const partner = io.sockets.sockets.get(waitingId);

        if (partner && partner.connected) {
          waitingByTag.delete(interest);
          matchUsers(socket, partner);
          return;
        } else {
          waitingByTag.delete(interest);
        }
      }

      waitingByTag.set(interest, socket.id);
      socket.emit('waiting', `Looking for someone into "${interest}"...`);

    } else {
      if (waitingAnyId && waitingAnyId !== socket.id) {
        const partner = io.sockets.sockets.get(waitingAnyId);

        if (partner && partner.connected) {
          waitingAnyId = null;
          matchUsers(socket, partner);
          return;
        } else {
          waitingAnyId = null;
        }
      }

      waitingAnyId = socket.id;
      socket.emit('waiting', 'Looking for a stranger...');
    }
  });

  const forwardEvents = ['message', 'public_key', 'typing', 'stop_typing', 'delete_message', 'message_read'];
  forwardEvents.forEach(evt => {
    socket.on(evt, (data) => {
      if (socket.room) socket.to(socket.room).emit(evt, data);
    });
  });

  socket.on('disconnect', () => {
    if (waitingAnyId === socket.id) waitingAnyId = null;

    if (
      socket.interest &&
      waitingByTag.get(socket.interest) === socket.id
    ) {
      waitingByTag.delete(socket.interest);
    }

    if (socket.room) {
      socket.to(socket.room).emit('partner_left');
    }

    broadcastCount();
  });
});

// ✅ Railway PORT
const PORT = process.env.PORT || 3000;

// ✅ Required for Railway
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

