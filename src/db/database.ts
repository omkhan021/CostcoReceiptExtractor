import {open, type DB} from '@op-engineering/op-sqlite';
import {DB_NAME} from '../utils/constants';
import {migration_001} from './migrations/001_initial';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

export async function initDb(): Promise<void> {
  if (_db) {
    return;
  }

  _db = open({name: DB_NAME});

  // Run migrations — split on semicolons and execute each statement
  const statements = migration_001
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of statements) {
    await _db.execute(sql);
  }
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
