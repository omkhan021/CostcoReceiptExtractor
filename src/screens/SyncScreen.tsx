import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ReceiptRow from '../components/ReceiptRow';
import {useSync} from '../hooks/useSync';
import {useReceipts} from '../hooks/useReceipts';
import {formatDisplayDate} from '../utils/dateUtils';
import type {AppStackParamList} from '../navigation/types';
import type {Receipt} from '../types';
import {useAuthStore} from '../store/authStore';
import {initClient, resetClient} from '../api/costcoClient';

type Nav = StackNavigationProp<AppStackParamList>;

export default function SyncScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {status, sync} = useSync();
  const {receipts, isLoading, reload} = useReceipts();
  const {credentials, clearCredentials} = useAuthStore();

  function handleLogout() {
    Alert.alert('Sign Out', 'Sign out of Costco? Your local receipts stay on this device.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          resetClient();
          await clearCredentials();
          // RootNavigator switches back to AuthStack automatically.
        },
      },
    ]);
  }

  useEffect(() => {
    if (credentials) {
      initClient(credentials);
    }
  }, [credentials]);

  async function handleSync() {
    if (!credentials) {
      Alert.alert('Not logged in', 'Please log in first.');
      return;
    }
    initClient(credentials);
    try {
      await sync();
      reload();
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : JSON.stringify(err);
      Alert.alert('Sync Failed', detail);
    }
  }

  function renderItem({item}: {item: Receipt}) {
    return (
      <ReceiptRow
        receipt={item}
        onPress={() => navigation.navigate('ReceiptDetail', {receiptId: item.id})}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Receipts</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRow}>
          {status.lastSyncAt && (
            <Text style={styles.lastSync}>
              Last sync: {formatDisplayDate(status.lastSyncAt)}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.syncButton, status.isRunning && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={status.isRunning}>
            {status.isRunning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
        {status.error && (
          <Text style={styles.errorText}>{status.error}</Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} color="#005DAA" />
      ) : receipts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No receipts yet. Tap "Sync Now" to fetch your Costco receipt history.
          </Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={r => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#005DAA',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  signOutButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  signOutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSync: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  syncButton: {
    backgroundColor: '#E31837', // Costco red
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#aaa',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#ffcdd2',
    fontSize: 12,
    marginTop: 6,
  },
  spinner: {
    marginTop: 40,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingBottom: 24,
  },
});
