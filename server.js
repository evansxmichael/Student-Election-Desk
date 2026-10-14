import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbManager } from './db.js';
import { accountStore, verifyToken } from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'election_store.json');
const ENV_FILE = path.join(__dirname, '.env');

// Get local network IP for mobile phones
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// In-memory student cache backed by JSON file - 100% instant load
let students = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    students = JSON.parse(raw);
    console.log(`[Local Hybrid Cache] Loaded ${students.length} voters from JSON in <5ms.`);
  }
} catch (e) {
  console.error('[Store] Error reading store, starting clean:', e.message);
}

function persistStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to write store:', err.message);
  }
}

// Auth Middleware for Express
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please sign in again.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin authorization required.' });
    }
    next();
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(msg, senderWs = null) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Background Database Connection & Reconciliation
(async () => {
  if (process.env.DATABASE_URL) {
    console.log('[Neon/Supabase] Background connecting to database...');
    const res = await dbManager.connect(process.env.DATABASE_URL);
    if (res.success) {
      const dbStudents = await dbManager.fetchAll();
      if (dbStudents && dbStudents.length > 0) {
        console.log(`[Neon/Supabase] Fetched ${dbStudents.length} records from cloud database.`);
        students = dbStudents;
        persistStore();
      } else if (students.length > 0) {
        console.log(`[Neon/Supabase] Cloud database is empty, syncing local roster (${students.length} voters)...`);
        await dbManager.batchSyncRoster(students);
      }

      // Permanently reconcile user credentials with Neon PostgreSQL
      const dbUsers = await dbManager.fetchAllUsers();
      if (dbUsers && dbUsers.length > 0) {
        accountStore.loadFromDb(dbUsers);
        console.log(`[Auth] Loaded and synchronized ${accountStore.accounts.length} permanent accounts from Neon database.`);
      } else {
        await dbManager.batchSyncUsers(accountStore.accounts);
      }
    }
  } else {
    console.log('[Neon/Supabase] Operating in instant Hybrid Local mode.');
  }
})();

// WebSocket Connection & Cryptographic RBAC Verification
wss.on('connection', (ws) => {
  // Send current state instantly to newly connected client
  ws.send(
    JSON.stringify({
      type: 'INIT',
      payload: students,
      timestamp: Date.now(),
      senderId: 'server',
      dbStatus: dbManager.getStatus(),
    })
  );

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      // Cryptographically verify token for any mutation
      const authUser = verifyToken(data.token);

      if (data.type === 'UPDATE_VOTE') {
        if (!authUser || (authUser.role !== 'editor' && authUser.role !== 'admin')) {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Unauthorized: Marking voter attendance requires Polling Agent or Admin privileges.',
            })
          );
        }

        const { id, status, votedAt } = data.payload;
        const votedBy = authUser.displayName || authUser.username;
        students = students.map((s) =>
          s.id === id ? { ...s, status, votedAt, votedBy, updatedAt: new Date().toISOString() } : s
        );
        persistStore();
        broadcast({ ...data, payload: { ...data.payload, votedBy } }, ws);

        dbManager.updateVote(id, status, votedAt, votedBy).catch(() => {});
      } else if (data.type === 'ADD_STUDENT') {
        if (!authUser || authUser.role !== 'admin') {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Adding candidates requires Admin privileges.',
            })
          );
        }

        students.push(data.payload);
        persistStore();
        broadcast(data, ws);

        dbManager.upsertStudent(data.payload).catch(() => {});
      } else if (data.type === 'UPDATE_STUDENT') {
        if (!authUser || authUser.role !== 'admin') {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Editing candidate details requires Admin privileges.',
            })
          );
        }

        students = students.map((s) => (s.id === data.payload.id ? data.payload : s));
        persistStore();
        broadcast(data, ws);

        dbManager.upsertStudent(data.payload).catch(() => {});
      } else if (data.type === 'DELETE_STUDENT') {
        if (!authUser || authUser.role !== 'admin') {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Deleting candidates requires Admin privileges.',
            })
          );
        }

        students = students.filter((s) => s.id !== data.payload.id);
        persistStore();
        broadcast(data, ws);

        dbManager.deleteStudent(data.payload.id).catch(() => {});
      } else if (data.type === 'BATCH_IMPORT') {
        if (!authUser || authUser.role !== 'admin') {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Batch importing candidate data requires Admin privileges.',
            })
          );
        }

        students = data.payload;
        persistStore();
        broadcast(data, ws);

        dbManager.batchSyncRoster(data.payload).catch(() => {});
      } else if (data.type === 'RESET_ALL') {
        if (!authUser || authUser.role !== 'admin') {
          return ws.send(
            JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Forbidden: Resetting voter data requires Admin privileges.',
            })
          );
        }

        students = [];
        persistStore();
        broadcast(data, ws);
      }
    } catch (e) {
      console.error('[WS] Message handling error:', e.message);
    }
  });
});

// ========================
// Authentication Endpoints
// ========================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const result = accountStore.authenticate(username, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ========================
// User Management Endpoints (Admin Only)
// ========================
app.get('/api/users', requireAdmin, (req, res) => {
  res.json(accountStore.getPublicUsers());
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { username, password, role, displayName } = req.body;
  const result = accountStore.createUser({ username, password, role, displayName });
  if (!result.success) {
    return res.status(400).json(result);
  }
  const created = accountStore.accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (created) {
    await dbManager.upsertUser(created);
  }
  res.json(result);
});

app.put('/api/users/:username/password', requireAdmin, async (req, res) => {
  const { password } = req.body;
  const result = accountStore.updatePassword(req.params.username, password);
  if (!result.success) {
    return res.status(400).json(result);
  }
  const updated = accountStore.accounts.find((a) => a.username.toLowerCase() === req.params.username.toLowerCase());
  if (updated) {
    await dbManager.upsertUser(updated);
  }
  res.json(result);
});

app.delete('/api/users/:username', requireAdmin, async (req, res) => {
  const result = accountStore.deleteUser(req.params.username, req.user.username);
  if (!result.success) {
    return res.status(400).json(result);
  }
  await dbManager.deleteUser(req.params.username);
  res.json(result);
});

// ========================
// Election Data Endpoints
// ========================
app.get('/api/info', (req, res) => {
  res.json({
    localIp: getLocalIp(),
    port: PORT,
    connectedDevices: wss.clients.size,
    votersCount: students.length,
    votedCount: students.filter((s) => s.status === 'Voted').length,
    db: dbManager.getStatus(),
  });
});

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.get('/api/db/status', (req, res) => {
  res.json(dbManager.getStatus());
});

// Protected Database Configuration (Admin Only)
app.post('/api/db/connect', requireAdmin, async (req, res) => {
  const { connectionUrl } = req.body;
  if (!connectionUrl) {
    return res.status(400).json({ success: false, message: 'connectionUrl is required' });
  }

  const result = await dbManager.connect(connectionUrl);
  if (result.success) {
    try {
      fs.writeFileSync(ENV_FILE, `DATABASE_URL="${connectionUrl}"\n`, 'utf-8');
    } catch (e) {
      console.error('Failed to write .env:', e.message);
    }

    if (students.length > 0) {
      await dbManager.batchSyncRoster(students);
    }
  }

  res.json({
    ...result,
    status: dbManager.getStatus(),
  });
});

app.post('/api/db/sync', requireAdmin, async (req, res) => {
  if (!dbManager.isConnected) {
    return res.status(400).json({ success: false, message: 'Database not connected' });
  }

  const dbStudents = await dbManager.fetchAll();
  if (dbStudents && dbStudents.length > 0) {
    students = dbStudents;
    persistStore();
    broadcast({ type: 'INIT', payload: students, timestamp: Date.now(), senderId: 'db_sync' });
    return res.json({ success: true, count: students.length, message: `Synced ${students.length} students from database` });
  } else if (students.length > 0) {
    await dbManager.batchSyncRoster(students);
    return res.json({ success: true, count: students.length, message: `Pushed ${students.length} students to database` });
  }

  res.json({ success: true, message: 'Already in sync' });
});

// Serve frontend static files if Vite production build exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`[Static] Serving frontend SPA from ${distPath}`);
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('====================================================');
  console.log(` Hybrid Multi-Device Sync Server is LIVE!`);
  console.log(` Web App Desktop: http://localhost:5173`);
  console.log(` Mobile Phone URL: http://${localIp}:5173`);
  console.log(` WebSocket & API:  http://localhost:${PORT}`);
  console.log(` Architecture:    Hybrid Instant-Cache + Cloud Postgres`);
  console.log(` Security:        PBKDF2 Cryptographic Hashing + Signed Session Tokens`);
  console.log('====================================================');
});
