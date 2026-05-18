import {getDb} from './database';
import type {Receipt, ReceiptItem, ReceiptOccurrence} from '../types';
import {toISODateTime} from '../utils/dateUtils';

export async function receiptExists(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute(
    'SELECT 1 FROM receipts WHERE id = ?',
    [id],
  );
  return result.rows.length > 0;
}

export async function insertReceiptWithItems(
  receipt: Omit<Receipt, 'syncedAt'>,
  items: Omit<ReceiptItem, 'id' | 'receiptId'>[],
): Promise<void> {
  const db = getDb();
  const syncedAt = toISODateTime();

  await db.transaction(async tx => {
    await tx.execute(
      `INSERT OR REPLACE INTO receipts
        (id, warehouse_name, purchase_date, subtotal, tax, total, raw_json, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receipt.id,
        receipt.warehouseName,
        receipt.purchaseDate,
        receipt.subtotal,
        receipt.tax,
        receipt.total,
        receipt.rawJson,
        syncedAt,
      ],
    );

    for (const item of items) {
      await tx.execute(
        `INSERT INTO receipt_items
          (receipt_id, item_number, item_name, item_name2, quantity, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          receipt.id,
          item.itemNumber,
          item.itemName,
          item.itemName2,
          item.quantity,
          item.amount,
        ],
      );
    }
  });
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const db = getDb();
  const result = await db.execute(
    'SELECT * FROM receipts ORDER BY purchase_date DESC',
  );
  return result.rows.map(rowToReceipt);
}

export async function getReceiptWithItems(
  receiptId: string,
): Promise<{receipt: Receipt; items: ReceiptItem[]} | null> {
  const db = getDb();

  const rResult = await db.execute(
    'SELECT * FROM receipts WHERE id = ?',
    [receiptId],
  );
  if (rResult.rows.length === 0) {
    return null;
  }

  const iResult = await db.execute(
    'SELECT * FROM receipt_items WHERE receipt_id = ? ORDER BY id',
    [receiptId],
  );

  return {
    receipt: rowToReceipt(rResult.rows[0]),
    items: iResult.rows.map(rowToItem),
  };
}

export async function getReceiptsContainingItem(
  itemName: string,
  since?: string,
): Promise<ReceiptOccurrence[]> {
  const db = getDb();
  const result = await db.execute(
    `SELECT r.id as receiptId, r.purchase_date as purchaseDate,
            r.warehouse_name as warehouseName, ri.amount
     FROM receipts r
     JOIN receipt_items ri ON ri.receipt_id = r.id
     WHERE ri.item_name = ?
       ${since ? 'AND r.purchase_date >= ?' : ''}
     ORDER BY r.purchase_date DESC`,
    since ? [itemName, since] : [itemName],
  );
  return result.rows.map(row => ({
    receiptId: row.receiptId as string,
    purchaseDate: row.purchaseDate as string,
    warehouseName: row.warehouseName as string | null,
    amount: row.amount as number | null,
  }));
}

export async function getDistinctItems(): Promise<
  Array<{itemName: string; itemNumber: string | null}>
> {
  const db = getDb();
  const result = await db.execute(
    `SELECT DISTINCT item_name as itemName, item_number as itemNumber
     FROM receipt_items
     ORDER BY item_name COLLATE NOCASE`,
  );
  return result.rows.map(row => ({
    itemName: row.itemName as string,
    itemNumber: row.itemNumber as string | null,
  }));
}

export async function getReceiptCount(): Promise<number> {
  const db = getDb();
  const result = await db.execute('SELECT COUNT(*) as count FROM receipts');
  return (result.rows[0].count as number) ?? 0;
}

export async function insertSyncLog(startedAt: string): Promise<number> {
  const db = getDb();
  const result = await db.execute(
    `INSERT INTO sync_log (started_at, status) VALUES (?, 'running')`,
    [startedAt],
  );
  return result.insertId ?? 0;
}

export async function updateSyncLog(
  id: number,
  data: {
    finishedAt: string;
    receiptsInserted: number;
    receiptsSkipped: number;
    receiptsFetched: number;
    status: 'success' | 'error';
    errorMsg?: string;
  },
): Promise<void> {
  const db = getDb();
  await db.execute(
    `UPDATE sync_log SET
       finished_at = ?, receipts_inserted = ?, receipts_skipped = ?,
       receipts_fetched = ?, status = ?, error_msg = ?
     WHERE id = ?`,
    [
      data.finishedAt,
      data.receiptsInserted,
      data.receiptsSkipped,
      data.receiptsFetched,
      data.status,
      data.errorMsg ?? null,
      id,
    ],
  );
}

// --- Row mappers ---

function rowToReceipt(row: Record<string, any>): Receipt {
  return {
    id: row.id as string,
    warehouseName: row.warehouse_name as string | null,
    purchaseDate: row.purchase_date as string,
    subtotal: row.subtotal as number | null,
    tax: row.tax as number | null,
    total: row.total as number | null,
    rawJson: row.raw_json as string | null,
    syncedAt: row.synced_at as string,
  };
}

function rowToItem(row: Record<string, any>): ReceiptItem {
  return {
    id: row.id as number,
    receiptId: row.receipt_id as string,
    itemNumber: row.item_number as string | null,
    itemName: row.item_name as string,
    itemName2: row.item_name2 as string | null,
    quantity: row.quantity as number,
    amount: row.amount as number | null,
  };
}
