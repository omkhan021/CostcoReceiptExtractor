#!/usr/bin/env node
/**
 * Probe Costco's receiptsWithCounts GraphQL endpoint to figure out which
 * documentType value the detail query actually accepts. Run from a terminal
 * — no rebuild required.
 *
 * Step 1: get a bearer token + client-identifier
 *   - Open Chrome on your laptop and sign in to https://www.costco.com
 *   - Open DevTools (Cmd+Opt+I) → Network tab
 *   - Visit https://www.costco.com/MyAccount → click "Orders & Returns" or
 *     anything that loads receipt data
 *   - Find a request to `ecom-api.costco.com/.../graphql` in the network list
 *   - In the Request Headers, copy:
 *       costco-x-authorization   (e.g. "Bearer eyJraWQ...")  — strip "Bearer "
 *       client-identifier        (a UUID)
 *
 * Step 2: run the probe
 *   BEARER='eyJ...' CLIENT_ID='xxxx-xxxx-...' node scripts/probe-costco-api.js
 *
 * Optional override: BARCODE='2116601...' to probe a specific transactionBarcode.
 * If omitted, the script first fetches a recent list and uses the first result.
 */

const https = require('https');

const BEARER = process.env.BEARER;
const CLIENT_ID = process.env.CLIENT_ID || '';
let BARCODE = process.env.BARCODE || null;

if (!BEARER) {
  console.error('Missing BEARER. See header comment in this file for how to grab one.');
  process.exit(1);
}

const COMMON_HEADERS = {
  'Content-Type': 'application/json-patch+json',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Origin: 'https://www.costco.com',
  Referer: 'https://www.costco.com/',
  'costco.env': 'ecom',
  'costco.service': 'restOrders',
  'costco-x-authorization': `Bearer ${BEARER}`,
  'costco-x-wcs-clientId': '4900eb1f-0c10-4bd9-99c3-c59e6c1ecebf',
  'client-identifier': CLIENT_ID,
};

function call(payload) {
  const body = JSON.stringify(payload);
  return new Promise(resolve => {
    const req = https.request(
      {
        hostname: 'ecom-api.costco.com',
        port: 443,
        path: '/ebusiness/order/v1/orders/graphql',
        method: 'POST',
        headers: {...COMMON_HEADERS, 'Content-Length': Buffer.byteLength(body)},
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve({status: res.statusCode, body: data}));
      },
    );
    req.on('error', err => resolve({status: 0, body: err.message}));
    req.write(body);
    req.end();
  });
}

const LIST_QUERY = `
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
      receipts {
        transactionBarcode
        documentType
        receiptType
        warehouseName
        total
      }
    }
  }
`;

const DETAIL_QUERY = `
  query receiptsWithCounts($barcode: String!, $documentType: String!) {
    receiptsWithCounts(barcode: $barcode, documentType: $documentType) {
      receipts {
        transactionBarcode
        warehouseName
        total
        totalItemCount
      }
    }
  }
`;

function toCostcoDate(d) {
  const m = d.getMonth() + 1;
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${m}/${dd}/${yyyy}`;
}

function preview(s, n = 350) {
  return (s || '').slice(0, n).replace(/\s+/g, ' ');
}

async function main() {
  // ──────────────────────────────────────────────────────────────
  // 1. Sanity-check the token with a list query
  // ──────────────────────────────────────────────────────────────
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);

  console.log(`\n=== LIST QUERY (last 3 months) ===`);
  const listRes = await call({
    query: LIST_QUERY,
    variables: {
      startDate: toCostcoDate(start),
      endDate: toCostcoDate(end),
      documentType: 'all',
      documentSubType: 'all',
    },
  });
  console.log(`HTTP ${listRes.status}`);

  if (listRes.status !== 200) {
    console.log(`body: ${preview(listRes.body, 800)}`);
    console.log(`\nList failed — token probably invalid/expired. Re-capture and retry.`);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(listRes.body);
  } catch {
    console.log(`Body not JSON: ${preview(listRes.body, 400)}`);
    process.exit(1);
  }

  const summaries = parsed?.data?.receiptsWithCounts?.receipts ?? [];
  console.log(`Returned ${summaries.length} receipts.`);

  // Show documentType distribution
  const typeCounts = {};
  for (const s of summaries) {
    const k = s.documentType ?? '(undefined)';
    typeCounts[k] = (typeCounts[k] ?? 0) + 1;
  }
  console.log(`documentType breakdown:`, typeCounts);

  if (summaries.length === 0) {
    console.log(`Nothing to probe (no receipts in window). Bump the window.`);
    process.exit(0);
  }

  // Pick a representative barcode for each unique documentType
  const seenTypes = {};
  for (const s of summaries) {
    const t = s.documentType ?? '(undefined)';
    if (!seenTypes[t] && s.transactionBarcode) seenTypes[t] = s.transactionBarcode;
  }

  const VARIANTS = [
    'warehouse',
    'Warehouse',
    'WAREHOUSE',
    'in-warehouse',
    'inWarehouse',
    'InWarehouse',
    'WarehouseReceiptDetail',
    'warehouseReceiptDetail',
    'gas',
    'gasStation',
    'GasStation',
    'GasStationReceiptDetail',
    'carwash',
    'carWash',
    'CarWash',
    'CarWashReceiptDetail',
    'all',
  ];

  // ──────────────────────────────────────────────────────────────
  // 2. For each unique list documentType, try every detail variant
  // ──────────────────────────────────────────────────────────────
  for (const [listType, barcode] of Object.entries(seenTypes)) {
    const probeBarcode = BARCODE || barcode;
    console.log(
      `\n=== DETAIL probe — list documentType="${listType}" — barcode=${probeBarcode} ===`,
    );

    for (const v of VARIANTS) {
      const res = await call({
        query: DETAIL_QUERY,
        variables: {barcode: probeBarcode, documentType: v},
      });

      let receiptsCount = '-';
      let snippet = preview(res.body, 180);
      try {
        const j = JSON.parse(res.body);
        const arr = j?.data?.receiptsWithCounts?.receipts;
        if (Array.isArray(arr)) receiptsCount = arr.length;
        if (j?.errors) {
          snippet = `errors=${preview(JSON.stringify(j.errors), 250)}`;
        }
      } catch {
        /* keep raw */
      }

      const tag =
        receiptsCount !== '-' && receiptsCount > 0
          ? '✅'
          : res.status === 200
          ? '·'
          : '✗';
      console.log(
        `  ${tag} documentType="${v.padEnd(28)}" → HTTP ${res.status}, receipts=${receiptsCount}`,
      );
      if (res.status !== 200 || receiptsCount === 0) {
        console.log(`     ${snippet}`);
      }
    }

    if (BARCODE) break; // honor user override, don't loop
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
