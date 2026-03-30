import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {Receipt} from '../types';
import {formatDisplayDate} from '../utils/dateUtils';

interface Props {
  receipt: Receipt;
  onPress: () => void;
}

export default function ReceiptRow({receipt, onPress}: Props) {
  const total = receipt.total != null ? `$${receipt.total.toFixed(2)}` : '—';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.warehouse}>
          {receipt.warehouseName ?? 'Costco Warehouse'}
        </Text>
        <Text style={styles.date}>{formatDisplayDate(receipt.purchaseDate)}</Text>
      </View>
      <Text style={styles.total}>{total}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  warehouse: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#005DAA',
  },
});
