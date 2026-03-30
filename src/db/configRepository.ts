import {getDb} from './database';

export async function getConfig(key: string): Promise<string | null> {
  const db = getDb();
  const result = await db.execute(
    'SELECT value FROM app_config WHERE key = ?',
    [key],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].value as string;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.execute(
    'INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function deleteConfig(key: string): Promise<void> {
  const db = getDb();
  await db.execute('DELETE FROM app_config WHERE key = ?', [key]);
}
