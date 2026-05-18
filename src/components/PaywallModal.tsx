import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {usePremiumStore} from '../store/premiumStore';
import {FREE_SEARCH_LIMIT, FREE_HISTORY_MONTHS} from '../utils/constants';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function PaywallModal({visible, onDismiss}: Props) {
  const {purchase, isPurchasing, purchaseError} = usePremiumStore();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            You've used all {FREE_SEARCH_LIMIT} free searches for today.
          </Text>

          <View style={styles.featureList}>
            <FeatureRow free="3 searches / day" premium="Unlimited searches" />
            <FeatureRow
              free={`${FREE_HISTORY_MONTHS} months of history`}
              premium="Full 2-year history"
            />
            <FeatureRow free="Ads" premium="No ads" />
          </View>

          {purchaseError ? (
            <Text style={styles.errorText}>{purchaseError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.upgradeButton, isPurchasing && styles.upgradeButtonDisabled]}
            onPress={purchase}
            disabled={isPurchasing}>
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.upgradeText}>Upgrade — $3.99</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} disabled={isPurchasing}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({free, premium}: {free: string; premium: string}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureCol}>
        <Text style={styles.featureTierLabel}>Free</Text>
        <Text style={styles.featureFreeText}>{free}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
      <View style={styles.featureCol}>
        <Text style={styles.featureTierLabel}>Premium</Text>
        <Text style={styles.featurePremiumText}>{premium}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#005DAA',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f8ff',
    borderRadius: 8,
    padding: 12,
  },
  featureCol: {
    flex: 1,
  },
  featureTierLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  featureFreeText: {
    fontSize: 13,
    color: '#555',
  },
  featurePremiumText: {
    fontSize: 13,
    color: '#005DAA',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 16,
    color: '#005DAA',
    marginHorizontal: 8,
  },
  upgradeButton: {
    backgroundColor: '#005DAA',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    color: '#888',
    fontSize: 14,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#c00',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
});
