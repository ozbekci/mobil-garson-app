const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/handshake', (req, res) => {
  res.json({ ok: true, message: 'handshake ok' });
});

// Mock data for waiters
const mockWaiters = [
  { id: 1, name: 'Ali' },
  { id: 2, name: 'Ayşe' },
  { id: 3, name: 'Mehmet' },
];

// Return active waiters
app.get('/waiters/active', (req, res) => {
  res.json(mockWaiters);
});

// Waiter login: expects { waiterId, pin }
app.post('/waiter/login', (req, res) => {
  const { waiterId, pin } = req.body || {};
  const w = mockWaiters.find(x => x.id === Number(waiterId));
  if (!w) return res.status(404).json({ error: 'Waiter not found' });
  // simple pin check: pin '1234' accepted for all
  if (String(pin) !== '1234') return res.status(401).json({ error: 'Invalid pin' });
  return res.json({ waiter: w, accessToken: 'mock-token-' + w.id, lastCheckin: new Date().toISOString() });
});

// Waiter status
app.get('/waiter/status', (req, res) => {
  const waiterId = Number(req.query.waiterId);
  const w = mockWaiters.find(x => x.id === waiterId);
  if (!w) return res.status(404).json({ error: 'Not found' });
  res.json({ active: true });
});

// Owner verify (patron) - expects { password }
app.post('/owner/verify', (req, res) => {
  const { password } = req.body || {};
  // Accept 'owner' as correct password in mock
  if (password === 'owner') return res.json({ ok: true });
  return res.status(401).json({ ok: false, error: 'Invalid owner password' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('auth', (token) => {
    console.log('auth token', token);
    socket.emit('auth_ok');
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log('backend running on', port));
