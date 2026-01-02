#!/usr/bin/env node
// Standalone Socket.IO Server für Schafkopf
// Läuft auf Port 3002, neben dem Next.js Server auf Port 3001

const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.SOCKET_PORT || 3002;

// HTTP Server für Socket.IO
const httpServer = http.createServer((req, res) => {
  // Health-Check Endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: io.engine.clientsCount }));
    return;
  }

  // Trigger Endpoint für Events von Next.js API
  if (req.method === 'POST' && req.url === '/trigger') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { channel, event, data } = JSON.parse(body);

        if (!channel || !event) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'channel und event erforderlich' }));
          return;
        }

        io.to(channel).emit(event, data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Socket.IO handled seine eigenen Requests, also nur 404 für unbekannte
  if (!req.url?.startsWith('/socket.io')) {
    res.writeHead(404);
    res.end();
  }
});

// Socket.IO Server mit CORS für den Next.js Client
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
});

// Presence-Channel State
const channels = new Map();

// Verbindungs-Handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client verbunden: ${socket.id}`);

  let currentChannels = new Set();
  let userData = null;

  // Channel abonnieren
  socket.on('subscribe', (data) => {
    const { channel, playerId, playerName } = data;

    socket.join(channel);
    currentChannels.add(channel);

    // Presence-Channel Logik
    if (channel.startsWith('presence-') && playerId && playerName) {
      userData = { id: playerId, name: playerName, socketId: socket.id };

      if (!channels.has(channel)) {
        channels.set(channel, new Map());
      }

      const channelMembers = channels.get(channel);
      channelMembers.set(socket.id, userData);

      // Anderen Mitgliedern mitteilen
      socket.to(channel).emit('pusher:member_added', userData);

      // Aktuelle Mitglieder an den neuen Subscriber senden
      const members = Array.from(channelMembers.values());
      socket.emit('pusher:subscription_succeeded', {
        members,
        count: members.length,
        me: userData,
      });

      console.log(`[Socket] ${playerName} tritt ${channel} bei (${members.length} Mitglieder)`);
    }
  });

  // Channel verlassen
  socket.on('unsubscribe', (channel) => {
    socket.leave(channel);
    currentChannels.delete(channel);

    if (channel.startsWith('presence-') && userData) {
      const channelMembers = channels.get(channel);
      if (channelMembers) {
        channelMembers.delete(socket.id);

        socket.to(channel).emit('pusher:member_removed', userData);

        if (channelMembers.size === 0) {
          channels.delete(channel);
        }

        console.log(`[Socket] ${userData.name} verlässt ${channel}`);
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client getrennt: ${socket.id}`);

    // Aus allen Presence-Channels entfernen
    for (const channel of currentChannels) {
      if (channel.startsWith('presence-') && userData) {
        const channelMembers = channels.get(channel);
        if (channelMembers) {
          channelMembers.delete(socket.id);
          io.to(channel).emit('pusher:member_removed', userData);

          if (channelMembers.size === 0) {
            channels.delete(channel);
          }
        }
      }
    }
  });
});

// Server starten
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Socket] Socket.IO Server läuft auf Port ${PORT}`);
  console.log(`[Socket] Health-Check: http://localhost:${PORT}/health`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('[Socket] SIGTERM empfangen, fahre herunter...');
  io.close(() => {
    httpServer.close(() => {
      console.log('[Socket] Server beendet');
      process.exit(0);
    });
  });
});
