/**
 * Costco API configuration.
 *
 * To find the correct endpoint and headers:
 * 1. Open Chrome DevTools on costco.com while logged in
 * 2. Go to Network tab, filter by "graphql" or "receipt"
 * 3. Find requests to the receipts endpoint
 * 4. Copy the URL, Authorization header value, client-id, and client-identifier
 *
 * Alternatively use mitmproxy/Charles Proxy against the Costco mobile app.
 *
 * Reference projects that have already done this:
 * - https://github.com/TechStud/TCRDD
 * - https://github.com/harrykhh/Costco-Receipt-Downloader
 * - https://github.com/dangoldin/costco-analysis
 */

export const COSTCO_GRAPHQL_URL =
  'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql';

// Header names (confirmed from network inspection)
export const COSTCO_AUTH_HEADER = 'costco-x-authorization';
export const COSTCO_CLIENT_IDENTIFIER_HEADER = 'client-identifier'; // per-session UUID from WebView
export const COSTCO_WCS_CLIENT_ID_HEADER = 'costco-x-wcs-clientId';
export const COSTCO_WCS_CLIENT_ID = '4900eb1f-0c10-4bd9-99c3-c59e6c1ecebf'; // static app-level ID

// costco.com login page loaded in WebView for auth
export const COSTCO_LOGIN_URL = 'https://www.costco.com/logon-instoreprint.html';
export const COSTCO_HOME_URL = 'https://www.costco.com';

// Receipts are fetched in 6-month windows per Costco API pagination
export const SYNC_WINDOW_MONTHS = 6;
// How many years back to fetch (up to 2 years available)
export const SYNC_MAX_YEARS = 2;

export const DB_NAME = 'costco_receipts.db';

// Fuse.js search tuning
export const FUSE_THRESHOLD = 0.35; // 0 = exact match, 1 = match anything
export const SEARCH_DEBOUNCE_MS = 250;

// Secure storage keys
export const STORAGE_KEY_CREDENTIALS = 'costco_credentials';
