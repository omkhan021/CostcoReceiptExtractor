import React, {useEffect, useRef, useState, Component, type ReactNode} from 'react';
import {Animated, StatusBar, View, Text, ScrollView, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/components/SplashScreen';
import {initDb} from './src/db/database';
import {usePremiumStore} from './src/store/premiumStore';
import mobileAds from 'react-native-google-mobile-ads';

const SPLASH_MIN_MS = 2200;
const SPLASH_FADE_MS = 500;

class ErrorBoundary extends Component<
  {children: ReactNode},
  {error: Error | null}
> {
  state = {error: null};
  static getDerivedStateFromError(error: Error) {
    return {error};
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>App crashed</Text>
          <Text style={styles.errorMsg}>{err.message}</Text>
          <Text style={styles.errorStack}>{err.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const loadPremium = usePremiumStore(s => s.load);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const minDisplay = new Promise<void>(resolve =>
      setTimeout(() => resolve(), SPLASH_MIN_MS),
    );
    const init = initDb()
      .then(loadPremium)
      .then(() => mobileAds().initialize())
      .catch(err => {
        console.error('Failed to initialize:', err);
      });

    Promise.all([minDisplay, init]).finally(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(() => setSplashVisible(false));
    });
  }, [loadPremium, splashOpacity]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#005DAA" />
          <RootNavigator />
          {splashVisible && <SplashScreen opacity={splashOpacity} />}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 12,
  },
  errorMsg: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  errorStack: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});
