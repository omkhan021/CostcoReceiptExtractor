import type {AuthCredentials} from '../types';

/**
 * JavaScript injected into the WebView on costco.com.
 * It patches XMLHttpRequest and fetch to intercept outgoing request headers.
 * When it detects an Authorization header (bearer token) + client-id header,
 * it posts the captured credentials back to React Native via postMessage.
 *
 * This runs in the WebView's JS context — window.ReactNativeWebView is the bridge.
 */
export const WEBVIEW_AUTH_INJECTION = `
(function() {
  if (window.__costcoAuthInjected) return;
  window.__costcoAuthInjected = true;

  var captured = {};

  function tryPost() {
    if (captured['costco-x-authorization']) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'COSTCO_AUTH',
        bearerToken: captured['costco-x-authorization'].replace(/^Bearer /i, ''),
        clientIdentifier: captured['client-identifier'] || '',
      }));
    }
  }

  var WATCHED = ['costco-x-authorization', 'client-identifier'];

  // Intercept XMLHttpRequest headers
  var originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    var lower = name.toLowerCase();
    if (WATCHED.indexOf(lower) !== -1) {
      captured[lower] = value;
      tryPost();
    }
    return originalSetHeader.call(this, name, value);
  };

  // Intercept fetch headers
  var originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    if (init && init.headers) {
      var h = init.headers;
      var entries = h instanceof Headers
        ? Array.from(h.entries())
        : Object.entries(h);
      entries.forEach(function(pair) {
        var lower = pair[0].toLowerCase();
        if (WATCHED.indexOf(lower) !== -1) {
          captured[lower] = pair[1];
        }
      });
      tryPost();
    }
    return originalFetch.apply(window, arguments);
  };
})();
true; // Required for injectedJavaScript prop
`;

export function parseAuthMessage(
  messageData: string,
): AuthCredentials | null {
  try {
    const msg = JSON.parse(messageData);
    if (msg.type === 'COSTCO_AUTH' && msg.bearerToken) {
      return {
        bearerToken: msg.bearerToken,
        clientIdentifier: msg.clientIdentifier ?? '',
      };
    }
  } catch {
    // not our message, ignore
  }
  return null;
}
