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
import ReceiptRow from '../components/ReceiptRow';
import {useSync} from '../hooks/useSync';
import {useReceipts} from '../hooks/useReceipts';
import {formatDisplayDate} from '../utils/dateUtils';
import type {AppStackParamList} from '../navigation/types';
import type {Receipt} from '../types';
import {useAuthStore} from '../store/authStore';
import {initClient} from '../api/costcoClient';

type Nav = StackNavigationProp<AppStackParamList>;

export default function SyncScreen() {
  const navigation = useNavigation<Nav>();
  const {status, sync} = useSync();
  const {receipts, isLoading, reload} = useReceipts();
  const {credentials} = useAuthStore();

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
    } catch {
      Alert.alert('Sync Failed', status.error ?? 'Unknown error. Check your connection.');
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
      <View style={styles.header}>
        <Text style={styles.title}>My Receipts</Text>
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
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
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
