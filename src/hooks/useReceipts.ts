import {useState, useEffect, useCallback} from 'react';
import {getAllReceipts, getReceiptWithItems} from '../db/receiptRepository';
import type {Receipt, ReceiptItem} from '../types';

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReceipts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllReceipts();
      setReceipts(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return {receipts, isLoading, reload: loadReceipts};
}

export function useReceiptDetail(receiptId: string) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getReceiptWithItems(receiptId).then(data => {
      if (cancelled) {
        return;
      }
      if (data) {
        setReceipt(data.receipt);
        setItems(data.items);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [receiptId]);

  return {receipt, items, isLoading};
}
