import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {ReceiptItem} from '../types';

interface Props {
  item: ReceiptItem;
  highlighted?: boolean;
}

export default function ReceiptItemRow({item, highlighted = false}: Props) {
  const amount = item.amount != null ? `$${item.amount.toFixed(2)}` : '—';

  return (
    <View style={[styles.row, highlighted && styles.highlighted]}>
      <View style={styles.left}>
        <Text style={styles.name}>{item.itemName}</Text>
        {item.itemName2 ? (
          <Text style={styles.name2}>{item.itemName2}</Text>
        ) : null}
        {item.itemNumber ? (
          <Text style={styles.number}>#{item.itemNumber}</Text>
        ) : null}
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  highlighted: {
    backgroundColor: '#FFF8E1', // light yellow highlight
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    color: '#111',
  },
  name2: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  number: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
