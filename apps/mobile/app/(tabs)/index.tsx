import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getDeviceInfo } from '../../utils/device-detection';

export default function DashboardScreen() {
  const deviceInfo = getDeviceInfo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome back, Student!
        </Text>
        
        <Text style={styles.subtitle}>
          Device: {deviceInfo.platform} {deviceInfo.deviceType}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Continue Learning</Text>
          <Text style={styles.cardSubtitle}>Pick up where you left off</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Market Analysis</Text>
          <Text style={styles.cardSubtitle}>View latest market trends</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.cardSubtitle}>Your progress this week</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#3b82f6',
  },
});