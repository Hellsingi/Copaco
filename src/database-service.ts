import sqlite3 from 'sqlite3';
import { Quote } from './types';

interface QuoteRow {
  id: string;
  content: string;
  author: string;
  tags: string;
  likes: number;
  source: string;
  created_at: string;
  updated_at: string;
}

interface LikesRow {
  likes: number;
}

export class DatabaseService {
  private db: sqlite3.Database;

  constructor(dbPath: string = './quotes.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createQuotesTable = `
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        tags TEXT,
        likes INTEGER DEFAULT 0,
        source TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createQuotesTable, (err) => {
      if (err) {
        console.error('Error creating quotes table:', err);
      } else {
        console.log('Database initialized successfully');
      }
    });
  }

  async saveQuote(quote: Quote): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO quotes
        (id, content, author, tags, likes, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const tags = JSON.stringify(quote.tags);
      const values = [
        quote.id,
        quote.content,
        quote.author,
        tags,
        quote.likes,
        quote.source,
        quote.createdAt.toISOString(),
        quote.updatedAt.toISOString(),
      ];

      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getQuote(id: string): Promise<Quote | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM quotes WHERE id = ?';

      this.db.get(sql, [id], (err, row: QuoteRow | undefined) => {
        if (err) {
          reject(err);
        } else if (row) {
          const quote: Quote = {
            id: row.id,
            content: row.content,
            author: row.author,
            tags: JSON.parse(row.tags || '[]'),
            likes: row.likes,
            source: row.source,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
          resolve(quote);
        } else {
          resolve(null);
        }
      });
    });
  }

  async likeQuote(id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      // First check if quote exists
      this.db.get('SELECT likes FROM quotes WHERE id = ?', [id], (err, row: LikesRow | undefined) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Quote not found'));
        } else {
          // Update the likes count
          const sql = `
            UPDATE quotes
            SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `;

          this.db.run(sql, [id], function(updateErr) {
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(row.likes + 1);
            }
          });
        }
      });
    });
  }

  async getMostLikedQuotes(limit: number = 10): Promise<Quote[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM quotes ORDER BY likes DESC LIMIT ?';

      this.db.all(sql, [limit], (err, rows: QuoteRow[]) => {
        if (err) {
          reject(err);
        } else {
          const quotes = rows.map(row => ({
            id: row.id,
            content: row.content,
            author: row.author,
            tags: JSON.parse(row.tags || '[]'),
            likes: row.likes,
            source: row.source,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }));
          resolve(quotes);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
