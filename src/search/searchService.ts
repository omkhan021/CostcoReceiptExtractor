import {getReceiptsContainingItem} from '../db/receiptRepository';
import type {SearchResult} from '../types';
import {getFuseIndex} from './fuseIndex';

export async function searchItems(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const fuse = await getFuseIndex();
  const fuseResults = fuse.search(query);

  const results: SearchResult[] = [];

  for (const fuseResult of fuseResults) {
    const {itemName, itemNumber} = fuseResult.item;
    const receipts = await getReceiptsContainingItem(itemName);

    if (receipts.length === 0) {
      continue;
    }

    results.push({
      itemName,
      itemNumber,
      receiptCount: receipts.length,
      mostRecentDate: receipts[0].purchaseDate,
      receipts,
    });
  }

  return results;
}
