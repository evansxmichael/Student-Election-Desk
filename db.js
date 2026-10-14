import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

class HybridDatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionUrl = process.env.DATABASE_URL || '';
    this.syncQueue = [];
    this.isSyncing = false;
  }

  async connect(customUrl) {
    const url = customUrl || this.connectionUrl || process.env.DATABASE_URL;
    if (!url || !url.startsWith('postgres')) {
      this.isConnected = false;
      return { success: false, message: 'No PostgreSQL connection string provided' };
    }

    try {
      if (this.pool) {
        await this.pool.end().catch(() => {});
      }

      this.pool = new Pool({
        connectionString: url,
        ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
      });

      this.pool.on('error', (err) => {
        console.warn('[Neon/Postgres] Idle client notice:', err.message);
        this.isConnected = false;
        this.scheduleRetry();
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      
      // Auto-migrate schema
      await client.query(`
        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          roll VARCHAR(100),
          course VARCHAR(150),
          year VARCHAR(100),
          residence VARCHAR(50) DEFAULT 'Hostel',
          status VARCHAR(50) DEFAULT 'Not yet marked',
          gender VARCHAR(20) DEFAULT 'Male',
          notes TEXT,
          voted_at TIMESTAMPTZ,
          voted_by VARCHAR(150),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
        CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll);
        CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

        CREATE TABLE IF NOT EXISTS app_users (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role VARCHAR(50) NOT NULL,
          display_name VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON app_users(username);
      `);

      client.release();
      this.isConnected = true;
      this.connectionUrl = url;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      console.log('[Neon/Postgres] Connected successfully & schema verified.');
      
      // Drain any queued mutations
      this.flushQueue();

      return { success: true, message: 'Connected to Neon/PostgreSQL' };
    } catch (err) {
      this.isConnected = false;
      console.warn('[Neon/Postgres] Connection warning:', err.message);
      this.scheduleRetry();
      return { success: false, message: err.message };
    }
  }

  scheduleRetry() {
    if (!this.retryTimer && (this.connectionUrl || process.env.DATABASE_URL)) {
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        console.log('[Neon/Postgres] Auto-reconnecting to database...');
        this.connect().catch(() => {});
      }, 8000);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      hasUrl: Boolean(this.connectionUrl),
      type: this.connectionUrl.includes('neon.tech')
        ? 'Neon PostgreSQL'
        : this.connectionUrl.includes('supabase')
        ? 'Supabase PostgreSQL'
        : 'PostgreSQL',
      maskedUrl: this.connectionUrl
        ? this.connectionUrl.replace(/:([^@]+)@/, ':****@')
        : '',
      queuedItems: this.syncQueue.length,
    };
  }

  async fetchAll() {
    if (!this.isConnected || !this.pool) return null;
    try {
      const res = await this.pool.query('SELECT * FROM students ORDER BY roll ASC, name ASC');
      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        roll: r.roll || '',
        course: r.course || '',
        year: r.year || '',
        residence: r.residence || 'Hostel',
        status: r.status || 'Not yet marked',
        gender: r.gender || 'Male',
        notes: r.notes || '',
        votedAt: r.voted_at ? r.voted_at.toISOString() : undefined,
        votedBy: r.voted_by || undefined,
        updatedAt: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.error('[Neon/Postgres] Fetch error:', err.message);
      return null;
    }
  }

  async upsertStudent(student) {
    if (!this.isConnected || !this.pool) {
      this.syncQueue.push({ action: 'upsert', student });
      return;
    }
    try {
      await this.pool.query(
        `INSERT INTO students (id, name, roll, course, year, residence, status, notes, voted_at, voted_by, gender, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           roll = EXCLUDED.roll,
           course = EXCLUDED.course,
           year = EXCLUDED.year,
           residence = EXCLUDED.residence,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           voted_at = EXCLUDED.voted_at,
           voted_by = EXCLUDED.voted_by,
           gender = EXCLUDED.gender,
           updated_at = NOW()`,
        [
          student.id,
          student.name,
          student.roll || null,
          student.course || null,
          student.year || null,
          student.residence || 'Hostel',
          student.status || 'Not yet marked',
          student.notes || null,
          student.votedAt || null,
          student.votedBy || null,
          student.gender || 'Male',
        ]
      );
    } catch (err) {
      console.error('[Neon/Postgres] Upsert failed, queuing:', err.message);
      this.syncQueue.push({ action: 'upsert', student });
    }
  }

  async updateVote(id, status, votedAt, votedBy) {
    if (!this.isConnected || !this.pool) {
      this.syncQueue.push({ action: 'vote', id, status, votedAt, votedBy });
      return;
    }
    try {
      await this.pool.query(
        `UPDATE students 
         SET status = $1, voted_at = $2, voted_by = $3, updated_at = NOW() 
         WHERE id = $4`,
        [status, votedAt || null, votedBy || null, id]
      );
    } catch (err) {
      console.error('[Neon/Postgres] Vote update failed, queuing:', err.message);
      this.syncQueue.push({ action: 'vote', id, status, votedAt, votedBy });
    }
  }

  async deleteStudent(id) {
    if (!this.isConnected || !this.pool) {
      this.syncQueue.push({ action: 'delete', id });
      return;
    }
    try {
      await this.pool.query('DELETE FROM students WHERE id = $1', [id]);
    } catch (err) {
      this.syncQueue.push({ action: 'delete', id });
    }
  }

  async batchSyncRoster(students) {
    if (!this.isConnected || !this.pool || !students.length) return;
    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const chunkSize = 50;
        for (let i = 0; i < students.length; i += chunkSize) {
          const chunk = students.slice(i, i + chunkSize);
          const values = [];
          const rowsSql = chunk.map((s, idx) => {
            const offset = idx * 11;
            values.push(
              s.id,
              s.name,
              s.roll || null,
              s.course || null,
              s.year || null,
              s.residence || 'Hostel',
              s.status || 'Not yet marked',
              s.notes || null,
              s.votedAt || null,
              s.votedBy || null,
              s.gender || 'Male'
            );
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, NOW())`;
          }).join(', ');

          await client.query(
            `INSERT INTO students (id, name, roll, course, year, residence, status, notes, voted_at, voted_by, gender, updated_at)
             VALUES ${rowsSql}
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               roll = EXCLUDED.roll,
               course = EXCLUDED.course,
               year = EXCLUDED.year,
               residence = EXCLUDED.residence,
               status = EXCLUDED.status,
               notes = EXCLUDED.notes,
               voted_at = EXCLUDED.voted_at,
               voted_by = EXCLUDED.voted_by,
               gender = EXCLUDED.gender,
               updated_at = NOW()`,
            values
          );
        }
        await client.query('COMMIT');
        console.log(`[Neon/Postgres] Synced ${students.length} students to cloud database.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[Neon/Postgres] Batch sync error:', err.message);
    }
  }

  async flushQueue() {
    if (this.isSyncing || !this.isConnected || this.syncQueue.length === 0) return;
    this.isSyncing = true;
    console.log(`[Neon/Postgres] Flushing ${this.syncQueue.length} queued offline mutations...`);
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      if (item.action === 'upsert') {
        await this.upsertStudent(item.student);
      } else if (item.action === 'vote') {
        await this.updateVote(item.id, item.status, item.votedAt, item.votedBy);
      } else if (item.action === 'delete') {
        await this.deleteStudent(item.id);
      }
    }
    this.isSyncing = false;
  }

  async fetchAllUsers() {
    if (!this.isConnected || !this.pool) return null;
    try {
      const res = await this.pool.query('SELECT * FROM app_users ORDER BY created_at ASC');
      return res.rows.map((r) => ({
        id: r.id,
        username: r.username,
        hash: r.hash,
        salt: r.salt,
        role: r.role,
        displayName: r.display_name,
        createdAt: r.created_at,
      }));
    } catch (e) {
      console.warn('[Neon/Postgres] fetchAllUsers notice:', e.message);
      return null;
    }
  }

  async batchSyncUsers(users) {
    if (!this.isConnected || !this.pool || !users || !users.length) return;
    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (const u of users) {
          await client.query(
            `INSERT INTO app_users (id, username, hash, salt, role, display_name, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (username) DO UPDATE SET
               hash = EXCLUDED.hash,
               salt = EXCLUDED.salt,
               role = EXCLUDED.role,
               display_name = EXCLUDED.display_name,
               updated_at = NOW()`,
            [u.id, u.username, u.hash, u.salt, u.role, u.displayName, u.createdAt || new Date().toISOString()]
          );
        }
        await client.query('COMMIT');
        console.log(`[Neon/Postgres] Cloud synced ${users.length} user accounts.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[Neon/Postgres] Batch sync users warning:', err.message);
    }
  }

  async upsertUser(user) {
    if (!this.isConnected || !this.pool) return;
    try {
      await this.pool.query(
        `INSERT INTO app_users (id, username, hash, salt, role, display_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (username) DO UPDATE SET
           hash = EXCLUDED.hash,
           salt = EXCLUDED.salt,
           role = EXCLUDED.role,
           display_name = EXCLUDED.display_name,
           updated_at = NOW()`,
        [user.id, user.username, user.hash, user.salt, user.role, user.displayName, user.createdAt || new Date().toISOString()]
      );
    } catch (err) {
      console.warn('[Neon/Postgres] Upsert user warning:', err.message);
    }
  }

  async deleteUser(username) {
    if (!this.isConnected || !this.pool) return;
    try {
      await this.pool.query('DELETE FROM app_users WHERE LOWER(username) = LOWER($1)', [username]);
    } catch (err) {
      console.warn('[Neon/Postgres] Delete user warning:', err.message);
    }
  }
}

export const dbManager = new HybridDatabaseManager();
