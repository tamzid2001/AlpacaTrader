import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function MarketDataScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Market Data</Text>
        
        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>AAPL</Text>
            <Text style={[styles.price, styles.positive]}>$175.43</Text>
          </View>
          <Text style={[styles.change, styles.positive]}>+2.34 (+1.35%)</Text>
        </View>

        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>MSFT</Text>
            <Text style={[styles.price, styles.negative]}>$412.81</Text>
          </View>
          <Text style={[styles.change, styles.negative]}>-5.67 (-1.36%)</Text>
        </View>

        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>GOOGL</Text>
            <Text style={[styles.price, styles.positive]}>$141.20</Text>
          </View>
          <Text style={[styles.change, styles.positive]}>+3.12 (+2.26%)</Text>
        </View>

        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>TSLA</Text>
            <Text style={[styles.price, styles.negative]}>$248.42</Text>
          </View>
          <Text style={[styles.change, styles.negative]}>-8.93 (-3.47%)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market Indices</Text>
        </View>

        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>S&P 500</Text>
            <Text style={[styles.price, styles.positive]}>4,567.89</Text>
          </View>
          <Text style={[styles.change, styles.positive]}>+12.34 (+0.27%)</Text>
        </View>

        <View style={styles.marketCard}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>NASDAQ</Text>
            <Text style={[styles.price, styles.positive]}>14,234.56</Text>
          </View>
          <Text style={[styles.change, styles.positive]}>+45.67 (+0.32%)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  marketCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  symbolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  change: {
    fontSize: 14,
    fontWeight: '500',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
});