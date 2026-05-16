export interface Receipt {
  id: string; // transactionBarcode from Costco API
  warehouseName: string | null;
  purchaseDate: string; // ISO 8601 date string
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  rawJson: string | null;
  syncedAt: string; // ISO 8601 datetime when we stored this
}

export interface ReceiptItem {
  id: number;
  receiptId: string;
  itemNumber: string | null;
  itemName: string; // itemDescription01 from API
  itemName2: string | null; // itemDescription02 from API
  quantity: number;
  amount: number | null;
}

export interface SearchResult {
  itemName: string;
  itemNumber: string | null;
  receiptCount: number;
  mostRecentDate: string;
  receipts: ReceiptOccurrence[];
}

export interface ReceiptOccurrence {
  receiptId: string;
  purchaseDate: string;
  warehouseName: string | null;
  amount: number | null;
}

// Raw shape from Costco GraphQL API (confirmed from network traffic)
export interface CostcoReceipt {
  transactionBarcode: string;
  transactionDate: string;
  transactionDateTime?: string;
  warehouseName?: string;
  warehouseShortName?: string;
  warehouseNumber?: string;
  companyNumber?: string;
  registerNumber?: string;
  transactionNumber?: string;
  transactionType?: string;
  receiptType?: string;
  documentType?: string;
  total?: number;
  subTotal?: number;
  taxes?: number;
  instantSavings?: number;
  totalItemCount?: number;
  membershipNumber?: string;
  invoiceNumber?: string;
  sequenceNumber?: string;
  warehouseAddress1?: string;
  warehouseAddress2?: string;
  warehouseCity?: string;
  warehouseState?: string;
  warehouseCountry?: string;
  warehousePostalCode?: string;
  itemArray: CostcoItem[];
  tenderArray?: CostcoTender[];
  subTaxes?: CostcoSubTaxes;
}

// Alias for backward compat within codebase
export type CostcoReceiptSummary = CostcoReceipt;
export type CostcoReceiptDetail = CostcoReceipt;

export interface CostcoItem {
  itemNumber?: string;
  itemIdentifier?: string;
  itemDescription01: string;
  frenchItemDescription1?: string;
  itemDescription02?: string;
  frenchItemDescription2?: string;
  itemDepartmentNumber?: string;
  transDepartmentNumber?: string;
  unit?: string;
  amount?: number;
  itemUnitPriceAmount?: number;
  taxFlag?: string;
  merchantID?: string;
  entryMethod?: string;
  fuelUnitQuantity?: number;
  fuelGradeCode?: string;
  fuelUomCode?: string;
  fuelUomDescription?: string;
  fuelGradeDescription?: string;
}

export interface CostcoTender {
  tenderTypeCode?: string;
  tenderSubTypeCode?: string;
  tenderDescription?: string;
  tenderTypeName?: string;
  amountTender?: number;
  displayAccountNumber?: string;
  sequenceNumber?: string;
  approvalNumber?: string;
  responseCode?: string;
  transactionID?: string;
  merchantID?: string;
  entryMethod?: string;
  walletType?: string;
  walletId?: string;
}

export interface CostcoSubTaxes {
  tax1?: number;
  tax2?: number;
  tax3?: number;
  tax4?: number;
  aTaxPercent?: number;
  aTaxLegend?: string;
  aTaxAmount?: number;
}

// GraphQL response wrapper
export interface ReceiptsWithCountsResponse {
  data: {
    receiptsWithCounts: {
      inWarehouse?: number;
      gasStation?: number;
      carWash?: number;
      gasAndCarWash?: number;
      receipts: CostcoReceipt[];
    };
  };
}

export interface AuthCredentials {
  bearerToken: string;
  clientIdentifier: string; // per-session UUID sent as client-identifier header
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: string | null;
  receiptsTotal: number;
  error: string | null;
  // Diagnostic counters surfaced from the most recent sync run
  fetched?: number;
  inserted?: number;
  skipped?: number;
  failed?: number;
  lastSkipReason?: string;
}
