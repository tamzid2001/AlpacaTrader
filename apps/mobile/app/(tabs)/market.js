import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const { width } = Dimensions.get('window');

export default function MarketData() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [watchlist, setWatchlist] = useState(new Set(['AAPL', 'GOOGL', 'TSLA']));

  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  const [marketData, setMarketData] = useState([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 150.25,
      change: 2.35,
      changePercent: 1.59,
      volume: '89.2M',
      marketCap: '2.45T',
      pe: 28.9,
      chartData: [145, 147, 149, 148, 150, 152, 150.25]
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 2750.80,
      change: -15.20,
      changePercent: -0.55,
      volume: '45.1M',
      marketCap: '1.78T',
      pe: 24.3,
      chartData: [2780, 2770, 2760, 2765, 2755, 2750, 2750.80]
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 242.15,
      change: 8.90,
      changePercent: 3.82,
      volume: '156.8M',
      marketCap: '768.4B',
      pe: 85.2,
      chartData: [230, 235, 238, 240, 238, 244, 242.15]
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 875.60,
      change: 25.40,
      changePercent: 2.99,
      volume: '78.3M',
      marketCap: '2.15T',
      pe: 65.8,
      chartData: [840, 855, 860, 865, 870, 880, 875.60]
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 378.85,
      change: -3.15,
      changePercent: -0.82,
      volume: '32.1M',
      marketCap: '2.81T',
      pe: 32.4,
      chartData: [385, 382, 380, 378, 375, 377, 378.85]
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 145.30,
      change: 4.25,
      changePercent: 3.01,
      volume: '67.9M',
      marketCap: '1.52T',
      pe: 42.1,
      chartData: [138, 140, 142, 144, 143, 146, 145.30]
    }
  ]);

  const marketIndices = [
    { name: 'S&P 500', symbol: 'SPX', value: 4567.89, change: 0.85, color: '#10b981' },
    { name: 'NASDAQ', symbol: 'IXIC', value: 14234.56, change: 1.23, color: '#10b981' },
    { name: 'DOW JONES', symbol: 'DJI', value: 34567.12, change: -0.42, color: '#ef4444' },
    { name: 'RUSSELL 2000', symbol: 'RUT', value: 1987.45, change: 0.67, color: '#10b981' }
  ];

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 42580.25, change: 2.84, changePercent: 3.45 },
    { symbol: 'ETH', name: 'Ethereum', price: 2684.50, change: -45.30, changePercent: -1.66 },
    { symbol: 'ADA', name: 'Cardano', price: 0.485, change: 0.012, changePercent: 2.54 }
  ];

  const commodities = [
    { symbol: 'GOLD', name: 'Gold', price: 2034.50, change: -8.75, changePercent: -0.43, unit: '/oz' },
    { symbol: 'OIL', name: 'Crude Oil', price: 78.45, change: 1.25, changePercent: 1.62, unit: '/bbl' },
    { symbol: 'SILVER', name: 'Silver', price: 24.85, change: 0.35, changePercent: 1.43, unit: '/oz' }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      const updatedData = marketData.map(stock => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 5,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      }));
      setMarketData(updatedData);
      setRefreshing(false);
    }, 1500);
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(symbol)) {
        newWatchlist.delete(symbol);
      } else {
        newWatchlist.add(symbol);
      }
      return newWatchlist;
    });
  };

  const renderMiniChart = (data) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <View style={styles.miniChart}>
        {data.map((value, index) => {
          const height = range > 0 ? ((value - min) / range) * 20 + 5 : 12.5;
          return (
            <View
              key={index}
              style={[
                styles.chartBar,
                { 
                  height,
                  backgroundColor: data[data.length - 1] > data[0] ? '#10b981' : '#ef4444'
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const formatPrice = (price) => {
    return price >= 1000 ? 
      `$${(price / 1000).toFixed(2)}K` : 
      `$${price.toFixed(2)}`;
  };

  const formatChange = (change, changePercent) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market Data</Text>
        <Text style={styles.subtitle}>Real-time financial information</Text>
        
        <View style={styles.lastUpdated}>
          <MaterialIcons name="access-time" size={14} color="#6b7280" />
          <Text style={styles.lastUpdatedText}>Last updated: {new Date().toLocaleTimeString()}</Text>
        </View>
      </View>

      {/* Market Indices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Indices</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {marketIndices.map((index, i) => (
            <View key={i} style={styles.indexCard} data-testid={`index-card-${index.symbol}`}>
              <Text style={styles.indexName}>{index.name}</Text>
              <Text style={styles.indexValue}>{index.value.toLocaleString()}</Text>
              <Text style={[styles.indexChange, { color: index.color }]}>
                {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
            data-testid={`button-timeframe-${timeframe}`}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.timeframeTextActive
            ]}>
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stock List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stocks</Text>
        {marketData.map((stock) => (
          <TouchableOpacity key={stock.symbol} style={styles.stockCard} data-testid={`stock-card-${stock.symbol}`}>
            <View style={styles.stockHeader}>
              <View style={styles.stockInfo}>
                <View style={styles.stockTitleRow}>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                  <TouchableOpacity
                    onPress={() => toggleWatchlist(stock.symbol)}
                    data-testid={`button-watchlist-${stock.symbol}`}
                  >
                    <MaterialIcons
                      name={watchlist.has(stock.symbol) ? "star" : "star-border"}
                      size={20}
                      color={watchlist.has(stock.symbol) ? "#fbbf24" : "#9ca3af"}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stockName}>{stock.name}</Text>
              </View>
              
              <View style={styles.stockPriceInfo}>
                <Text style={styles.stockPrice}>{formatPrice(stock.price)}</Text>
                <Text style={[
                  styles.stockChange,
                  stock.change >= 0 ? styles.positiveChange : styles.negativeChange
                ]}>
                  {formatChange(stock.change, stock.changePercent)}
                </Text>
              </View>
            </View>

            {/* Mini Chart */}
            {renderMiniChart(stock.chartData)}

            {/* Stock Details */}
            <View style={styles.stockDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Volume</Text>
                <Text style={styles.detailValue}>{stock.volume}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Market Cap</Text>
                <Text style={styles.detailValue}>{stock.marketCap}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>P/E Ratio</Text>
                <Text style={styles.detailValue}>{stock.pe}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cryptocurrency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cryptocurrency</Text>
        {cryptoData.map((crypto) => (
          <View key={crypto.symbol} style={styles.cryptoCard} data-testid={`crypto-card-${crypto.symbol}`}>
            <View style={styles.cryptoInfo}>
              <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
              <Text style={styles.cryptoName}>{crypto.name}</Text>
            </View>
            <View style={styles.cryptoPriceInfo}>
              <Text style={styles.cryptoPrice}>${crypto.price.toLocaleString()}</Text>
              <Text style={[
                styles.cryptoChange,
                crypto.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatChange(crypto.change, crypto.changePercent)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Commodities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commodities</Text>
        {commodities.map((commodity) => (
          <View key={commodity.symbol} style={styles.commodityCard} data-testid={`commodity-card-${commodity.symbol}`}>
            <View style={styles.commodityInfo}>
              <Text style={styles.commoditySymbol}>{commodity.symbol}</Text>
              <Text style={styles.commodityName}>{commodity.name}</Text>
            </View>
            <View style={styles.commodityPriceInfo}>
              <Text style={styles.commodityPrice}>${commodity.price.toFixed(2)}{commodity.unit}</Text>
              <Text style={[
                styles.commodityChange,
                commodity.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatChange(commodity.change, commodity.changePercent)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Market News Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market News</Text>
          <TouchableOpacity data-testid="button-view-all-news">
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.newsCard}>
          <View style={styles.newsContent}>
            <Text style={styles.newsTitle}>Fed Maintains Interest Rates</Text>
            <Text style={styles.newsDescription}>
              Federal Reserve keeps interest rates steady amid inflation concerns
            </Text>
            <Text style={styles.newsTime}>2 hours ago</Text>
          </View>
          <MaterialIcons name="trending-up" size={24} color="#0ea5e9" />
        </View>
        
        <View style={styles.newsCard}>
          <View style={styles.newsContent}>
            <Text style={styles.newsTitle}>Tech Stocks Rally</Text>
            <Text style={styles.newsDescription}>
              Major technology companies show strong quarterly earnings
            </Text>
            <Text style={styles.newsTime}>4 hours ago</Text>
          </View>
          <MaterialIcons name="computer" size={24} color="#10b981" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  indexCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  indexName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  indexValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  indexChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 8,
    borderRadius: 12,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  stockCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  stockName: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockPriceInfo: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 25,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  cryptoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  cryptoName: {
    fontSize: 14,
    color: '#6b7280',
  },
  cryptoPriceInfo: {
    alignItems: 'flex-end',
  },
  cryptoPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  cryptoChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  commodityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  commodityInfo: {
    flex: 1,
  },
  commoditySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  commodityName: {
    fontSize: 14,
    color: '#6b7280',
  },
  commodityPriceInfo: {
    alignItems: 'flex-end',
  },
  commodityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  commodityChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  newsTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});