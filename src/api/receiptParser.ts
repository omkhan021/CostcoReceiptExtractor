import type {CostcoReceipt, Receipt, ReceiptItem} from '../types';
import {toISODate} from '../utils/dateUtils';

export function parseReceipt(
  raw: CostcoReceipt,
): {receipt: Omit<Receipt, 'syncedAt'>; items: Omit<ReceiptItem, 'id' | 'receiptId'>[]} {
  const receipt: Omit<Receipt, 'syncedAt'> = {
    id: raw.transactionBarcode,
    warehouseName: raw.warehouseName ?? raw.warehouseShortName ?? null,
    purchaseDate: toISODate(raw.transactionDate),
    subtotal: raw.subTotal ?? null,
    tax: raw.taxes ?? null,
    total: raw.total ?? null,
    rawJson: JSON.stringify(raw),
  };

  const items: Omit<ReceiptItem, 'id' | 'receiptId'>[] = (raw.itemArray ?? []).map(item => ({
    itemNumber: item.itemNumber ?? item.itemIdentifier ?? null,
    itemName: item.itemDescription01,
    itemName2: item.itemDescription02 ?? null,
    quantity: 1,
    amount: item.amount ?? null,
  }));

  return {receipt, items};
}
