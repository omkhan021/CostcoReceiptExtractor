import Fuse from 'fuse.js';
import {getDistinctItems} from '../db/receiptRepository';
import {FUSE_THRESHOLD} from '../utils/constants';

interface IndexEntry {
  itemName: string;
  itemNumber: string | null;
}

let _fuse: Fuse<IndexEntry> | null = null;
let _building = false;

export function invalidateFuseIndex(): void {
  _fuse = null;
}

async function buildIndex(): Promise<Fuse<IndexEntry>> {
  const items = await getDistinctItems();

  const fuse = new Fuse<IndexEntry>(items, {
    keys: [
      {name: 'itemName', weight: 0.9},
      {name: 'itemNumber', weight: 0.1},
    ],
    threshold: FUSE_THRESHOLD,
    includeScore: true,
    minMatchCharLength: 2,
  });

  return fuse;
}

export async function getFuseIndex(): Promise<Fuse<IndexEntry>> {
  if (_fuse) {
    return _fuse;
  }

  // Prevent concurrent builds
  if (_building) {
    await new Promise<void>(resolve => {
      const interval = setInterval(() => {
        if (!_building) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
    return _fuse!;
  }

  _building = true;
  try {
    _fuse = await buildIndex();
    return _fuse;
  } finally {
    _building = false;
  }
}
