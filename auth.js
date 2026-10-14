import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS_FILE = path.join(__dirname, 'data', 'accounts.json');
const JWT_SECRET = process.env.JWT_SECRET || 'election_desk_default_secret_key_change_in_prod';

// Hash password with salt using PBKDF2
export function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Generate signed session token
export function createToken(user) {
  const payload = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

// Verify token
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

class AccountStore {
  constructor() {
    this.accounts = [];
    this.init();
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(ACCOUNTS_FILE)) {
      try {
        const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
        this.accounts = JSON.parse(raw);
        console.log(`[Auth] Loaded ${this.accounts.length} server accounts.`);
      } catch (e) {
        console.error('[Auth] Error loading accounts, re-seeding:', e.message);
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }

    this.ensureCoreAccounts();
  }

  ensureCoreAccounts() {
    const superAdminPass = process.env.ADMIN_INIT_PASS || 'zainmike1926@';
    const agentPass = process.env.AGENT_INIT_PASS || 'msuagent';
    const viewerPass = process.env.VIEWER_INIT_PASS || 'viewer123';

    const core = [
      { username: 'superadmin', pass: superAdminPass, role: 'admin', displayName: 'Chief Election Officer' },
      { username: 'admin', pass: superAdminPass, role: 'admin', displayName: 'Chief Election Officer' },
      { username: 'agent', pass: agentPass, role: 'editor', displayName: 'Polling Agent / Officer' },
      { username: 'viewer', pass: viewerPass, role: 'viewer', displayName: 'Election Observer (View Only)' },
    ];

    let changed = false;
    for (const c of core) {
      const idx = this.accounts.findIndex((a) => a.username.toLowerCase() === c.username);
      const { hash, salt } = hashPassword(c.pass);
      if (idx === -1) {
        this.accounts.push({
          id: `acc_${c.username}_perm`,
          username: c.username,
          hash,
          salt,
          role: c.role,
          displayName: c.displayName,
          createdAt: new Date().toISOString(),
        });
        changed = true;
      } else {
        // Enforce permanent credentials
        this.accounts[idx].hash = hash;
        this.accounts[idx].salt = salt;
        this.accounts[idx].role = c.role;
        changed = true;
      }
    }
    if (changed) {
      this.persist();
      console.log('[Auth] Synced permanent seed credentials for superadmin & agent.');
    }
  }

  loadFromDb(dbUsers) {
    if (Array.isArray(dbUsers) && dbUsers.length > 0) {
      this.accounts = dbUsers;
      this.ensureCoreAccounts();
      this.persist();
    }
  }

  seedDefaults() {
    const superAdminPass = process.env.ADMIN_INIT_PASS || 'zainmike1926@';
    const agentPass = process.env.AGENT_INIT_PASS || 'msuagent';
    const viewerPass = process.env.VIEWER_INIT_PASS || 'viewer123';

    const hSuper = hashPassword(superAdminPass);
    const hAgent = hashPassword(agentPass);
    const hViewer = hashPassword(viewerPass);

    this.accounts = [
      {
        id: 'acc_superadmin_root',
        username: 'superadmin',
        hash: hSuper.hash,
        salt: hSuper.salt,
        role: 'admin',
        displayName: 'Chief Election Officer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'acc_admin_root',
        username: 'admin',
        hash: hSuper.hash,
        salt: hSuper.salt,
        role: 'admin',
        displayName: 'Chief Election Officer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'acc_agent_default',
        username: 'agent',
        hash: hAgent.hash,
        salt: hAgent.salt,
        role: 'editor',
        displayName: 'Polling Agent / Officer',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'acc_viewer_default',
        username: 'viewer',
        hash: hViewer.hash,
        salt: hViewer.salt,
        role: 'viewer',
        displayName: 'Election Observer (View Only)',
        createdAt: new Date().toISOString(),
      },
    ];

    this.persist();
    console.log('[Auth] Initialized permanent server accounts securely with PBKDF2 hashing.');
  }

  persist() {
    try {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(this.accounts, null, 2), 'utf8');
    } catch (e) {
      console.error('[Auth] Failed to persist accounts:', e.message);
    }
  }

  authenticate(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password required.' };
    }
    const u = username.trim().toLowerCase();
    const p = password.trim();

    const acc = this.accounts.find((a) => a.username.toLowerCase() === u);
    if (!acc) {
      return { success: false, message: 'Invalid credentials.' };
    }

    const isValid = verifyPassword(p, acc.hash, acc.salt);
    if (!isValid) {
      return { success: false, message: 'Invalid credentials.' };
    }

    const token = createToken(acc);
    return {
      success: true,
      token,
      user: {
        username: acc.username,
        role: acc.role,
        displayName: acc.displayName,
      },
    };
  }

  getPublicUsers() {
    return this.accounts.map((a) => ({
      id: a.id,
      username: a.username,
      role: a.role,
      displayName: a.displayName,
      createdAt: a.createdAt,
    }));
  }

  createUser({ username, password, role, displayName }) {
    const u = username.trim().toLowerCase();
    if (!u || u.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters.' };
    }
    if (!password || password.trim().length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }
    if (this.accounts.some((a) => a.username.toLowerCase() === u)) {
      return { success: false, message: `Username "${u}" is already in use.` };
    }
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return { success: false, message: 'Invalid user role specified.' };
    }

    const { hash, salt } = hashPassword(password.trim());
    const newAcc = {
      id: `acc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      username: u,
      hash,
      salt,
      role,
      displayName: displayName?.trim() || u,
      createdAt: new Date().toISOString(),
    };

    this.accounts.push(newAcc);
    this.persist();
    return { success: true, user: { id: newAcc.id, username: newAcc.username, role: newAcc.role, displayName: newAcc.displayName, createdAt: newAcc.createdAt } };
  }

  updatePassword(username, newPassword) {
    const u = username.trim().toLowerCase();
    const p = newPassword.trim();
    if (!p || p.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }
    const acc = this.accounts.find((a) => a.username.toLowerCase() === u);
    if (!acc) {
      return { success: false, message: 'User not found.' };
    }

    const { hash, salt } = hashPassword(p);
    acc.hash = hash;
    acc.salt = salt;
    this.persist();
    return { success: true };
  }

  deleteUser(username, requestingUser) {
    const u = username.trim().toLowerCase();
    if (requestingUser && requestingUser.toLowerCase() === u) {
      return { success: false, message: 'You cannot delete your own active account.' };
    }

    const target = this.accounts.find((a) => a.username.toLowerCase() === u);
    if (!target) {
      return { success: false, message: 'Account not found.' };
    }

    if (target.role === 'admin') {
      const adminCount = this.accounts.filter((a) => a.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Cannot delete the only remaining Admin account.' };
      }
    }

    this.accounts = this.accounts.filter((a) => a.username.toLowerCase() !== u);
    this.persist();
    return { success: true };
  }
}

export const accountStore = new AccountStore();
