import { Pool } from 'pg';
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

interface DatabaseAdapter {
  query(text: string, params?: any[]): Promise<{ rows: any[], rowCount: number }>;
  close(): Promise<void>;
}

class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10
    });
  }

  async query(text: string, params?: any[]) {
    const result = await this.pool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  }

  async close() {
    await this.pool.end();
  }
}

class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database;

  constructor(filename: string) {
    this.db = new sqlite3.Database(filename);
  }

  async query(text: string, params?: any[]): Promise<{ rows: any[], rowCount: number }> {
    return new Promise((resolve, reject) => {
      // Converter query PostgreSQL para SQLite
      let sqliteQuery = text
        .replace(/\$(\d+)/g, '?')  // $1, $2 -> ?
        .replace(/NOW\(\)/g, "datetime('now')")
        .replace(/BOOLEAN/g, 'INTEGER')
        .replace(/VARCHAR\(\d+\)/g, 'TEXT')
        .replace(/TIMESTAMP/g, 'TEXT');

      if (text.toLowerCase().includes('insert') || text.toLowerCase().includes('update') || text.toLowerCase().includes('delete')) {
        this.db.run(sqliteQuery, params || [], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ rows: [], rowCount: this.changes || 0 });
          }
        });
      } else {
        this.db.all(sqliteQuery, params || [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows: rows || [], rowCount: (rows || []).length });
          }
        });
      }
    });
  }

  async close() {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

class DatabaseManager {
  private adapter: DatabaseAdapter | null = null;
  public isConnected = false;
  public dbType: 'postgresql' | 'sqlite' | 'memory' = 'memory';

  async connect(): Promise<void> {
    try {
      // Tentar PostgreSQL primeiro
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
        console.log('🔄 Tentando conectar ao PostgreSQL...');
        this.adapter = new PostgreSQLAdapter(process.env.DATABASE_URL);
        await this.adapter.query('SELECT 1');
        this.dbType = 'postgresql';
        this.isConnected = true;
        console.log('✅ Conectado ao PostgreSQL!');
        await this.ensureTables();
        return;
      }
    } catch (error: any) {
      console.log('⚠️  PostgreSQL não disponível:', error.message);
    }

    // Fallback para SQLite
    try {
      console.log('🔄 Usando SQLite como fallback...');
      const dbPath = path.join(__dirname, '../data/messages.db');
      this.adapter = new SQLiteAdapter(dbPath);
      this.dbType = 'sqlite';
      this.isConnected = true;
      console.log('✅ Conectado ao SQLite:', dbPath);
      await this.ensureTables();
      return;
    } catch (error: any) {
      console.log('⚠️  SQLite falhou:', error.message);
    }

    // Se tudo falhar, usar memória
    console.log('⚠️  Usando armazenamento em memória');
    this.isConnected = false;
  }

  async ensureTables(): Promise<void> {
    if (!this.adapter) return;

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        from_admin INTEGER DEFAULT 1,
        from_user_email TEXT,
        to_user_email TEXT,
        to_admin INTEGER DEFAULT 0,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_urgent INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL,
        cep TEXT,
        password_hash TEXT,
        profile_picture_base64 TEXT,
        services TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;

    // Para PostgreSQL, ajustar tipos
    const createTablesPostgreSQL = `
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        from_admin BOOLEAN DEFAULT true,
        from_user_email VARCHAR(255),
        to_user_email VARCHAR(255),
        to_admin BOOLEAN DEFAULT false,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_urgent BOOLEAN DEFAULT false,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL,
        cep VARCHAR(10),
        password_hash VARCHAR(255),
        profile_picture_base64 TEXT,
        services TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const sql = this.dbType === 'postgresql' ? createTablesPostgreSQL : createTablesSQL;
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await this.adapter.query(statement.trim());
      }
    }

    console.log('✅ Tabelas verificadas/criadas');
  }

  async query(text: string, params?: any[]): Promise<{ rows: any[], rowCount: number }> {
    if (!this.adapter) {
      throw new Error('Database not connected');
    }
    return this.adapter.query(text, params);
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.isConnected = false;
    }
  }
}

// Instância singleton
export const dbManager = new DatabaseManager();
export default dbManager;