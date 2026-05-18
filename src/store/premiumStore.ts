import {create} from 'zustand';
import {getConfig, setConfig} from '../db/configRepository';
import {
  initConnection,
  requestPurchase,
  getProducts,
  finishTransaction,
  purchaseUpdatedListener,
  type Purchase,
} from 'react-native-iap';

export const IAP_PRODUCT_ID = 'com.costcoreceiptextracter.premium';

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  purchaseError: string | null;
  load: () => Promise<void>;
  unlock: () => Promise<void>;
  purchase: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  isPremium: false,
  isLoading: true,
  isPurchasing: false,
  purchaseError: null,

  load: async () => {
    const val = await getConfig('is_premium');
    set({isPremium: val === '1', isLoading: false});

    // Set up IAP connection and purchase listener
    try {
      await initConnection();

      purchaseUpdatedListener(async (purchase: Purchase) => {
        await finishTransaction({purchase});
        await get().unlock();
      });
    } catch {
      // IAP not available (simulator, no Play Services, etc.) — ignore
    }
  },

  unlock: async () => {
    await setConfig('is_premium', '1');
    set({isPremium: true, isPurchasing: false});
  },

  purchase: async () => {
    set({isPurchasing: true, purchaseError: null});
    try {
      await getProducts({skus: [IAP_PRODUCT_ID]});
      await requestPurchase({skus: [IAP_PRODUCT_ID]});
      // unlock() is called by purchaseUpdatedListener when Google confirms
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({isPurchasing: false, purchaseError: msg});
    }
  },
}));
