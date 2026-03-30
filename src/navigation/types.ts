export type AuthStackParamList = {
  Login: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Sync: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  ReceiptDetail: {receiptId: string; highlightItem?: string};
};
