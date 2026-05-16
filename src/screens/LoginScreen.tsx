import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import WebView, {type WebViewMessageEvent} from 'react-native-webview';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {parseAuthMessage, WEBVIEW_AUTH_INJECTION} from '../api/authService';
import {initClient} from '../api/costcoClient';
import {useAuthStore} from '../store/authStore';
import {COSTCO_LOGIN_URL} from '../utils/constants';

const GO_TO_LOGON_JS = "window.location.href = 'https://www.costco.com/LogonForm'; true;";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {setCredentials} = useAuthStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const capturedRef = useRef(false);
  const webViewRef = useRef<WebView>(null);

  async function handleMessage(event: WebViewMessageEvent) {
    if (capturedRef.current) {
      return; // Already captured, ignore duplicate messages
    }

    const creds = parseAuthMessage(event.nativeEvent.data);
    if (!creds) {
      return;
    }

    capturedRef.current = true;
    setIsCapturing(true);

    try {
      initClient(creds);
      await setCredentials(creds);
      // Navigation happens automatically via RootNavigator reacting to isAuthenticated
    } catch (err) {
      capturedRef.current = false;
      setIsCapturing(false);
      Alert.alert('Login Failed', 'Could not save credentials. Please try again.');
    }
  }

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <View style={[styles.toolbar, {paddingTop: insets.top + 10}]}>
        <Text style={styles.toolbarTitle}>Sign in to Costco</Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => webViewRef.current?.injectJavaScript(GO_TO_LOGON_JS)}>
          <Text style={styles.signInButtonText}>Open Sign In</Text>
        </TouchableOpacity>
      </View>
      {isCapturing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#005DAA" />
          <Text style={styles.overlayText}>Signing in…</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{uri: COSTCO_LOGIN_URL}}
        // No userAgent override — desktop UA on a mobile device trips Akamai's
        // bot manager. Let the WebView send its native Android Chrome UA.
        // Incognito = no persistent cookies/storage. Critical for logout:
        // otherwise a remembered Costco session auto-restores and we end up
        // capturing a stale bearer token, bouncing the user back to AppStack.
        incognito
        injectedJavaScript={WEBVIEW_AUTH_INJECTION}
        onLoadEnd={() => {
          // Re-inject on every navigation: injectedJavaScript only reliably fires
          // on the first page load (esp. on Android), but we need interception
          // live on the post-signin redirect back to costco.com.
          webViewRef.current?.injectJavaScript(WEBVIEW_AUTH_INJECTION);
        }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#005DAA',
  },
  toolbarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  signInButtonText: {
    color: '#005DAA',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
});
