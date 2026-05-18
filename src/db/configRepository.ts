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

export async function getSearchesUsedToday(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const storedDate = await getConfig('search_count_date');
  if (storedDate !== today) {
    return 0;
  }
  const count = await getConfig('search_count');
  return count ? parseInt(count, 10) : 0;
}

export async function incrementSearchCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const storedDate = await getConfig('search_count_date');
  let count = 0;
  if (storedDate === today) {
    const stored = await getConfig('search_count');
    count = stored ? parseInt(stored, 10) : 0;
  }
  count++;
  await setConfig('search_count_date', today);
  await setConfig('search_count', count.toString());
  return count;
}
