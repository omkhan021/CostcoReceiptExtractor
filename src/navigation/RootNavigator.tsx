import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuthStore} from '../store/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

export default function RootNavigator() {
  const {isAuthenticated, isLoading, loadCredentials} = useAuthStore();

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#005DAA" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
