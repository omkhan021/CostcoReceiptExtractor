import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import type {SearchResult} from '../types';
import {formatDisplayDate} from '../utils/dateUtils';

interface Props {
  result: SearchResult;
  onSelectReceipt: (receiptId: string) => void;
}

export default function ItemResultRow({result, onSelectReceipt}: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggle}>
        <View style={styles.headerLeft}>
          <Text style={styles.itemName}>{result.itemName}</Text>
          {result.itemNumber && (
            <Text style={styles.itemNumber}>#{result.itemNumber}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.count}>{result.receiptCount} receipt{result.receiptCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded &&
        result.receipts.map(r => (
          <TouchableOpacity
            key={r.receiptId}
            style={styles.receiptRow}
            onPress={() => onSelectReceipt(r.receiptId)}>
            <View>
              <Text style={styles.receiptDate}>{formatDisplayDate(r.purchaseDate)}</Text>
              {r.warehouseName && (
                <Text style={styles.warehouseName}>{r.warehouseName}</Text>
              )}
            </View>
            {r.amount != null && (
              <Text style={styles.amount}>${r.amount.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  itemNumber: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  count: {
    fontSize: 13,
    color: '#005DAA',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 10,
    color: '#888',
    marginTop: 3,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  receiptDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  warehouseName: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
});
