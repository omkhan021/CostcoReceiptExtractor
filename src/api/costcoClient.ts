/**
 * Costco GraphQL API client.
 * Endpoint and headers confirmed from network inspection of my.costco.com.
 */

import axios, {type AxiosInstance} from 'axios';
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

export function initClient(creds: AuthCredentials): void {
  _client = axios.create({
    baseURL: COSTCO_GRAPHQL_URL,
    headers: {
      'Content-Type': 'application/json-patch+json',
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
}

function getClient(): AxiosInstance {
  if (!_client) {
    throw new Error('API client not initialized. Call initClient() first.');
  }
  return _client;
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
 * documentType: "warehouse" for in-store receipts
 */
export async function fetchReceiptDetail(
  barcode: string,
  documentType: string = 'warehouse',
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
): Promise<Array<{transactionBarcode: string; transactionDateTime: string}>> {
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
