import {fetchReceiptDetail, fetchReceiptList} from '../api/costcoClient';
import {parseReceipt} from '../api/receiptParser';
import {getConfig, setConfig} from '../db/configRepository';
import {
  insertReceiptWithItems,
  insertSyncLog,
  receiptExists,
  updateSyncLog,
} from '../db/receiptRepository';
import type {SyncStatus} from '../types';
import {
  buildSyncWindows,
  subtractMonths,
  toISODateTime,
} from '../utils/dateUtils';
import {SYNC_MAX_YEARS, SYNC_WINDOW_MONTHS} from '../utils/constants';
import {invalidateFuseIndex} from '../search/fuseIndex';

type SyncProgressCallback = (status: Partial<SyncStatus>) => void;

export async function runSync(
  onProgress?: SyncProgressCallback,
): Promise<void> {
  const startedAt = toISODateTime();
  const logId = await insertSyncLog(startedAt);

  let inserted = 0;
  let skipped = 0;
  let fetched = 0;

  onProgress?.({isRunning: true, error: null});

  try {
    // Determine fetch range: last_sync_cursor → today
    const lastCursor = await getConfig('last_sync_cursor');
    const fromDate = lastCursor
      ? new Date(lastCursor)
      : subtractMonths(new Date(), SYNC_MAX_YEARS * 12);
    const toDate = new Date();

    const windows = buildSyncWindows(fromDate, toDate, SYNC_WINDOW_MONTHS);

    for (const window of windows) {
      const summaries = await fetchReceiptList(window.start, window.end);
      fetched += summaries.length;

      for (const summary of summaries) {
        if (!summary.transactionBarcode) { continue; }
        const exists = await receiptExists(summary.transactionBarcode);
        if (exists) {
          skipped++;
          continue;
        }

        const detail = await fetchReceiptDetail(summary.transactionBarcode);
        const {receipt, items} = parseReceipt(detail);
        await insertReceiptWithItems(receipt, items);
        inserted++;

        onProgress?.({isRunning: true});
      }
    }

    // Advance the cursor to today so next sync only fetches new receipts
    await setConfig('last_sync_cursor', toDate.toISOString().split('T')[0]);

    await updateSyncLog(logId, {
      finishedAt: toISODateTime(),
      receiptsInserted: inserted,
      receiptsSkipped: skipped,
      receiptsFetched: fetched,
      status: 'success',
    });

    // Invalidate search index so next search reflects new data
    invalidateFuseIndex();

    onProgress?.({isRunning: false, error: null});
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    await updateSyncLog(logId, {
      finishedAt: toISODateTime(),
      receiptsInserted: inserted,
      receiptsSkipped: skipped,
      receiptsFetched: fetched,
      status: 'error',
      errorMsg,
    });

    onProgress?.({isRunning: false, error: errorMsg});
    throw err;
  }
}
