import {fetchReceiptDetail, fetchReceiptList} from '../api/costcoClient';
import {parseReceipt} from '../api/receiptParser';

// Confirmed via direct API probing (scripts/probe-costco-api.js):
// the detail endpoint accepts "all" as a wildcard documentType that works
// for every receipt type — warehouse, fuel, etc. Specific values like "gas"
// or "GasStationReceiptDetail" all return HTTP 400.
const DETAIL_DOC_TYPE = 'all';
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
  let failed = 0;
  let fetched = 0;
  let lastSkipReason: string | undefined;

  onProgress?.({
    isRunning: true,
    error: null,
    fetched: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    lastSkipReason: undefined,
  });

  try {
    // Determine fetch range: last_sync_cursor → today
    const lastCursor = await getConfig('last_sync_cursor');
    const fromDate = lastCursor
      ? new Date(lastCursor)
      : subtractMonths(new Date(), SYNC_MAX_YEARS * 12);
    const toDate = new Date();

    const windows = buildSyncWindows(fromDate, toDate, SYNC_WINDOW_MONTHS);
    console.log('[sync] windows', windows);

    for (const window of windows) {
      const summaries = await fetchReceiptList(window.start, window.end);
      fetched += summaries.length;

      const typeCounts: Record<string, number> = {};
      for (const s of summaries) {
        const key = s.documentType ?? '(undefined)';
        typeCounts[key] = (typeCounts[key] ?? 0) + 1;
      }
      console.log(
        '[sync] window',
        window.start,
        '→',
        window.end,
        'returned',
        summaries.length,
        'summaries — documentType breakdown:',
        typeCounts,
      );

      for (const summary of summaries) {
        if (!summary.transactionBarcode) { continue; }
        const exists = await receiptExists(summary.transactionBarcode);
        if (exists) {
          skipped++;
          continue;
        }

        try {
          const detail = await fetchReceiptDetail(
            summary.transactionBarcode,
            DETAIL_DOC_TYPE,
          );
          const {receipt, items} = parseReceipt(detail);
          await insertReceiptWithItems(receipt, items);
          inserted++;
        } catch (err) {
          // One bad receipt shouldn't kill the whole sync — log and move on.
          failed++;
          lastSkipReason = `${summary.documentType ?? '?'} ${summary.transactionBarcode}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          console.warn('[sync] skip receipt', lastSkipReason);
        }

        onProgress?.({isRunning: true, fetched, inserted, skipped, failed, lastSkipReason});
      }
    }

    console.log('[sync] done', {fetched, inserted, skipped, failed, lastSkipReason});

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

    onProgress?.({
      isRunning: false,
      error: null,
      fetched,
      inserted,
      skipped,
      failed,
      lastSkipReason,
    });
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
