import {useState, useCallback} from 'react';
import {runSync} from '../sync/syncEngine';
import type {SyncStatus} from '../types';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncAt: null,
    receiptsTotal: 0,
    error: null,
  });

  const sync = useCallback(async () => {
    if (status.isRunning) {
      return;
    }

    try {
      await runSync(partial => {
        setStatus(prev => ({...prev, ...partial}));
      });
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastSyncAt: new Date().toISOString(),
        error: null,
      }));
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [status.isRunning]);

  return {status, sync};
}
