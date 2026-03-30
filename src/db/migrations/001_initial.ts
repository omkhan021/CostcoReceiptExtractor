export const migration_001 = `
  CREATE TABLE IF NOT EXISTS receipts (
    id            TEXT PRIMARY KEY,
    warehouse_name TEXT,
    purchase_date TEXT NOT NULL,
    subtotal      REAL,
    tax           REAL,
    total         REAL,
    raw_json      TEXT,
    synced_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_receipts_purchase_date
    ON receipts(purchase_date DESC);

  CREATE TABLE IF NOT EXISTS receipt_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id     TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    item_number    TEXT,
    item_name      TEXT NOT NULL,
    item_name2     TEXT,
    quantity       REAL NOT NULL DEFAULT 1,
    amount         REAL
  );

  CREATE INDEX IF NOT EXISTS idx_items_receipt_id
    ON receipt_items(receipt_id);

  CREATE INDEX IF NOT EXISTS idx_items_item_name
    ON receipt_items(item_name COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS app_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at        TEXT NOT NULL,
    finished_at       TEXT,
    receipts_fetched  INTEGER DEFAULT 0,
    receipts_inserted INTEGER DEFAULT 0,
    receipts_skipped  INTEGER DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'running',
    error_msg         TEXT
  );
`;
