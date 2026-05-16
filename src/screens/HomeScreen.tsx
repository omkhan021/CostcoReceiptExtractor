import React from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';
import ItemResultRow from '../components/ItemResultRow';
import {useSearch} from '../hooks/useSearch';
import type {AppStackParamList} from '../navigation/types';
import type {SearchResult} from '../types';

type Nav = StackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {query, results, isSearching, search} = useSearch();

  function handleSelectReceipt(receiptId: string, itemName: string) {
    navigation.navigate('ReceiptDetail', {receiptId, highlightItem: itemName});
  }

  function renderItem({item}: {item: SearchResult}) {
    return (
      <ItemResultRow
        result={item}
        onSelectReceipt={(receiptId) => handleSelectReceipt(receiptId, item.itemName)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <Text style={styles.title}>Receipt Search</Text>
        <SearchBar value={query} onChangeText={search} />
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
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
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
});
