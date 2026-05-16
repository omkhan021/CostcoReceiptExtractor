import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import ReceiptItemRow from '../components/ReceiptItemRow';
import Barcode from '../components/Barcode';
import {useReceiptDetail} from '../hooks/useReceipts';
import {formatDisplayDate} from '../utils/dateUtils';
import type {AppStackParamList} from '../navigation/types';
import type {ReceiptItem} from '../types';

type Route = RouteProp<AppStackParamList, 'ReceiptDetail'>;

export default function ReceiptDetailScreen() {
  const {params} = useRoute<Route>();
  const {receipt, items, isLoading} = useReceiptDetail(params.receiptId);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#005DAA" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Receipt not found.</Text>
      </View>
    );
  }

  const total = receipt.total != null ? `$${receipt.total.toFixed(2)}` : '—';

  function renderItem({item}: {item: ReceiptItem}) {
    return (
      <ReceiptItemRow
        item={item}
        highlighted={
          params.highlightItem
            ? item.itemName === params.highlightItem
            : false
        }
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Text style={styles.warehouse}>
              {receipt.warehouseName ?? 'Costco Warehouse'}
            </Text>
            <Text style={styles.date}>
              {formatDisplayDate(receipt.purchaseDate)}
            </Text>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total}</Text>
            </View>
            {receipt.subtotal != null && (
              <View style={styles.totalsRow}>
                <Text style={styles.subLabel}>Subtotal</Text>
                <Text style={styles.subValue}>${receipt.subtotal.toFixed(2)}</Text>
              </View>
            )}
            {receipt.tax != null && (
              <View style={styles.totalsRow}>
                <Text style={styles.subLabel}>Tax</Text>
                <Text style={styles.subValue}>${receipt.tax.toFixed(2)}</Text>
              </View>
            )}
          </View>
          <View style={styles.barcodeCard}>
            <Barcode value={receipt.id} height={72} moduleWidth={2} />
            <Text style={styles.barcodeText}>{receipt.id}</Text>
          </View>
          <Text style={styles.itemsHeader}>Items ({items.length})</Text>
        </>
      }
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 15,
  },
  header: {
    backgroundColor: '#005DAA',
    padding: 16,
    paddingTop: 12,
  },
  warehouse: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 12,
  },
  barcodeCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  barcodeText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  itemsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  subValue: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  list: {
    paddingBottom: 32,
  },
});
