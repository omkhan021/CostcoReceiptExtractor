import React from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';
import ItemResultRow from '../components/ItemResultRow';
import PaywallModal from '../components/PaywallModal';
import {useSearch} from '../hooks/useSearch';
import {useAuthStore} from '../store/authStore';
import {usePremiumStore} from '../store/premiumStore';
import {resetClient} from '../api/costcoClient';
import type {AppStackParamList} from '../navigation/types';
import type {SearchResult} from '../types';
import {FREE_SEARCH_LIMIT} from '../utils/constants';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';

// Replace with real ad unit ID from AdMob console before publishing
const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

type Nav = StackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {query, results, isSearching, search, searchesUsed, limitReached, dismissLimit} = useSearch();
  const {clearCredentials} = useAuthStore();
  const {isPremium} = usePremiumStore();

  function handleLogout() {
    Alert.alert('Sign Out', 'Sign out of Costco? Your local receipts stay on this device.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          resetClient();
          await clearCredentials();
        },
      },
    ]);
  }

  function handleSelectReceipt(receiptId: string, itemName: string) {
    navigation.navigate('ReceiptDetail', {receiptId, highlightItem: itemName});
  }

  function renderItem({item}: {item: SearchResult}) {
    return (
      <ItemResultRow
        result={item}
        onSelectReceipt={receiptId => handleSelectReceipt(receiptId, item.itemName)}
      />
    );
  }

  const searchesLeft = Math.max(0, FREE_SEARCH_LIMIT - searchesUsed);

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Receipt Search</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <SearchBar value={query} onChangeText={search} />
        {!isPremium && (
          <Text style={styles.searchBadge}>
            {searchesLeft} free search{searchesLeft !== 1 ? 'es' : ''} left today
          </Text>
        )}
      </View>

      {isSearching && (
        <ActivityIndicator style={styles.spinner} color="#005DAA" />
      )}

      {!isSearching && query.trim() !== '' && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No items found for "{query}"</Text>
        </View>
      )}

      {!query.trim() && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Search for an item to find which receipts it appears in.
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.itemName}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />

      {!isPremium && (
        <View style={[styles.adBanner, {paddingBottom: insets.bottom || 8}]}>
          <BannerAd
            unitId={AD_UNIT_ID}
            size={BannerAdSize.BANNER}
            requestOptions={{requestNonPersonalizedAdsOnly: true}}
          />
        </View>
      )}

      <PaywallModal visible={limitReached} onDismiss={dismissLimit} />
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
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  searchBadge: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  spinner: {
    marginTop: 24,
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
  },
  list: {
    paddingBottom: 24,
  },
  adBanner: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f0f0f0',
  },
});
