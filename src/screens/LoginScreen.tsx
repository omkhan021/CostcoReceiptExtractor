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
import {parseAuthMessage, WEBVIEW_AUTH_INJECTION} from '../api/authService';
import {initClient} from '../api/costcoClient';
import {useAuthStore} from '../store/authStore';
import {COSTCO_LOGIN_URL} from '../utils/constants';

export default function LoginScreen() {
  const {setCredentials} = useAuthStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const capturedRef = useRef(false);

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
    <View style={styles.container}>
      {isCapturing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#005DAA" />
          <Text style={styles.overlayText}>Signing in…</Text>
        </View>
      )}
      <WebView
        source={{uri: COSTCO_LOGIN_URL}}
        injectedJavaScript={WEBVIEW_AUTH_INJECTION}
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
