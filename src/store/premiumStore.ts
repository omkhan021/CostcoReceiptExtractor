import {create} from 'zustand';
import {getConfig, setConfig} from '../db/configRepository';
import {
  initConnection,
  requestPurchase,
  fetchProducts,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
} from 'react-native-iap';

export const IAP_PRODUCT_ID = 'com.ktsolutionsltd.costcoreceiptfinder.premium';

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
        await finishTransaction({purchase, isConsumable: false});
        await get().unlock();
      });

      purchaseErrorListener((err) => {
        set({isPurchasing: false, purchaseError: err?.message ?? 'Purchase failed'});
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
      await fetchProducts({skus: [IAP_PRODUCT_ID], type: 'in-app'});
      await requestPurchase({
        request: {
          google: {skus: [IAP_PRODUCT_ID]},
          apple: {sku: IAP_PRODUCT_ID},
        },
        type: 'in-app',
      });
      // unlock() is called by purchaseUpdatedListener when Google confirms
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({isPurchasing: false, purchaseError: msg});
    }
  },
}));
