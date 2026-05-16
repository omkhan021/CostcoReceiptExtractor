/**
 * Costco GraphQL API client.
 * Endpoint and headers confirmed from network inspection of my.costco.com.
 */

import axios, {AxiosError, type AxiosInstance} from 'axios';
import type {AuthCredentials, CostcoReceipt, ReceiptsWithCountsResponse} from '../types';
import {
  COSTCO_GRAPHQL_URL,
  COSTCO_AUTH_HEADER,
  COSTCO_CLIENT_IDENTIFIER_HEADER,
  COSTCO_WCS_CLIENT_ID_HEADER,
  COSTCO_WCS_CLIENT_ID,
} from '../utils/constants';
import {toCostcoDate} from '../utils/dateUtils';

let _client: AxiosInstance | null = null;

// Costco's edge tier (Akamai/Cloudflare) rejects requests without a
// browser-like User-Agent. RN's default ("okhttp/...") gets dropped silently.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export class CostcoApiError extends Error {
  status?: number;
  code?: string;
  url?: string;
  responseBody?: string;
  constructor(opts: {
    message: string;
    status?: number;
    code?: string;
    url?: string;
    responseBody?: string;
  }) {
    super(opts.message);
    this.name = 'CostcoApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.url = opts.url;
    this.responseBody = opts.responseBody;
  }
}

function describeAxiosError(err: AxiosError): CostcoApiError {
  const url = err.config?.url
    ? `${err.config?.baseURL ?? ''}${err.config.url}`
    : err.config?.baseURL;
  const status = err.response?.status;
  const code = err.code; // ECONNABORTED, ERR_NETWORK, ETIMEDOUT, etc.
  const body = err.response?.data;
  const bodyText =
    typeof body === 'string'
      ? body.slice(0, 500)
      : body
      ? JSON.stringify(body).slice(0, 500)
      : undefined;

  // Extract the request variables — useful for 4xx where the body is the
  // result of what we sent. Costco's API is a POST to a single endpoint, so
  // the variables in the request body identify which call this was.
  let requestVars: string | undefined;
  try {
    if (err.config?.data) {
      const parsed =
        typeof err.config.data === 'string'
          ? JSON.parse(err.config.data)
          : err.config.data;
      requestVars = JSON.stringify(parsed.variables).slice(0, 200);
    }
  } catch {
    /* ignore */
  }

  let message: string;
  if (status) {
    message = `HTTP ${status}`;
    if (requestVars) message += ` vars=${requestVars}`;
    if (bodyText) message += ` body=${bodyText}`;
  } else if (code === 'ECONNABORTED') {
    message = 'Request timed out after 30s';
  } else if (code === 'ERR_NETWORK' || err.message === 'Network Error') {
    message =
      'No response from Costco (network/TLS/edge-block). ' +
      'Token may have expired or session cookies are missing — try signing in again.';
  } else {
    message = err.message || 'Unknown network error';
  }

  console.warn('[CostcoApiError]', {url, status, code, requestVars, body: bodyText});

  return new CostcoApiError({message, status, code, url, responseBody: bodyText});
}

export function initClient(creds: AuthCredentials): void {
  _client = axios.create({
    baseURL: COSTCO_GRAPHQL_URL,
    headers: {
      'Content-Type': 'application/json-patch+json',
      Accept: 'application/json',
      'User-Agent': BROWSER_USER_AGENT,
      Origin: 'https://www.costco.com',
      Referer: 'https://www.costco.com/',
      'costco.env': 'ecom',
      'costco.service': 'restOrders',
      [COSTCO_AUTH_HEADER]: `Bearer ${creds.bearerToken}`,
      [COSTCO_WCS_CLIENT_ID_HEADER]: COSTCO_WCS_CLIENT_ID,
      [COSTCO_CLIENT_IDENTIFIER_HEADER]: creds.clientIdentifier,
    },
    timeout: 30_000,
  });

  _client.interceptors.response.use(
    res => res,
    (err: unknown) => {
      if (axios.isAxiosError(err)) {
        return Promise.reject(describeAxiosError(err));
      }
      return Promise.reject(err);
    },
  );
}

function getClient(): AxiosInstance {
  if (!_client) {
    throw new Error('API client not initialized. Call initClient() first.');
  }
  return _client;
}

export function resetClient(): void {
  _client = null;
}

// Confirmed query from network inspection
const RECEIPT_DETAIL_QUERY = `
  query receiptsWithCounts($barcode: String!, $documentType: String!) {
    receiptsWithCounts(barcode: $barcode, documentType: $documentType) {
      receipts {
        warehouseName
        warehouseShortName
        receiptType
        documentType
        transactionDateTime
        transactionDate
        companyNumber
        warehouseNumber
        operatorNumber
        registerNumber
        transactionNumber
        transactionType
        transactionBarcode
        total
        warehouseAddress1
        warehouseAddress2
        warehouseCity
        warehouseState
        warehouseCountry
        warehousePostalCode
        totalItemCount
        subTotal
        taxes
        invoiceNumber
        sequenceNumber
        itemArray {
          itemNumber
          itemDescription01
          itemDescription02
          itemIdentifier
          itemDepartmentNumber
          unit
          amount
          itemUnitPriceAmount
          taxFlag
          merchantID
          entryMethod
        }
        tenderArray {
          tenderTypeCode
          tenderDescription
          tenderTypeName
          amountTender
          displayAccountNumber
          sequenceNumber
          approvalNumber
        }
        subTaxes {
          tax1
          tax2
          tax3
          tax4
          aTaxPercent
          aTaxLegend
          aTaxAmount
        }
        instantSavings
        membershipNumber
      }
    }
  }
`;

/**
 * Fetch a specific receipt by barcode.
 * documentType: pass "all" — it's a wildcard that works for every receipt
 * type (warehouse, fuel, etc). Confirmed by direct API probing; specific
 * values like "gas" or "GasStationReceiptDetail" all return HTTP 400.
 */
export async function fetchReceiptDetail(
  barcode: string,
  documentType: string = 'all',
): Promise<CostcoReceipt> {
  const client = getClient();

  const response = await client.post<ReceiptsWithCountsResponse>('', {
    query: RECEIPT_DETAIL_QUERY,
    variables: {barcode, documentType},
  });

  const receipts = response.data?.data?.receiptsWithCounts?.receipts;
  if (!receipts || receipts.length === 0) {
    throw new Error(`No receipt returned for barcode ${barcode}`);
  }
  return receipts[0];
}

const RECEIPT_LIST_QUERY = `
  query receiptsWithCounts(
    $startDate: String!
    $endDate: String!
    $documentType: String!
    $documentSubType: String!
  ) {
    receiptsWithCounts(
      startDate: $startDate
      endDate: $endDate
      documentType: $documentType
      documentSubType: $documentSubType
    ) {
      inWarehouse
      gasStation
      carWash
      gasAndCarWash
      receipts {
        transactionBarcode
        transactionDateTime
        warehouseName
        receiptType
        documentType
        transactionType
        total
        totalItemCount
        itemArray {
          itemNumber
        }
        tenderArray {
          tenderTypeCode
          tenderDescription
          amountTender
        }
        couponArray {
          upcnumberCoupon
        }
      }
    }
  }
`;

/**
 * Fetch all receipt summaries for a date window.
 * startDate / endDate are ISO strings (YYYY-MM-DD); they are converted to
 * the M/DD/YYYY format that the Costco API expects.
 */
export async function fetchReceiptList(
  startDate: string,
  endDate: string,
  documentType: string = 'all',
  documentSubType: string = 'all',
): Promise<
  Array<{
    transactionBarcode: string;
    transactionDateTime: string;
    documentType: string;
  }>
> {
  const client = getClient();

  const response = await client.post<ReceiptsWithCountsResponse>('', {
    query: RECEIPT_LIST_QUERY,
    variables: {
      startDate: toCostcoDate(startDate),
      endDate: toCostcoDate(endDate),
      documentType,
      documentSubType,
    },
  });

  return response.data?.data?.receiptsWithCounts?.receipts ?? [];
}
