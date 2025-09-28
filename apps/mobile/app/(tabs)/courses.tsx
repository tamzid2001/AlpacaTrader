import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../../components/ui/Button';

export default function CoursesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Courses</Text>
        
        <View style={styles.courseCard}>
          <Text style={styles.courseTitle}>Financial Markets 101</Text>
          <Text style={styles.courseDescription}>Learn the basics of financial markets and trading</Text>
          <Text style={styles.coursePrice}>$99.99</Text>
          <Button 
            title="Enroll Now"
            onPress={() => console.log('Navigate to course details')}
            style={styles.enrollButton}
          />
        </View>

        <View style={styles.courseCard}>
          <Text style={styles.courseTitle}>Advanced Trading Strategies</Text>
          <Text style={styles.courseDescription}>Master advanced trading techniques and risk management</Text>
          <Text style={styles.coursePrice}>$199.99</Text>
          <Button 
            title="Enroll Now"
            onPress={() => console.log('Navigate to course details')}
            style={styles.enrollButton}
          />
        </View>

        <View style={styles.courseCard}>
          <Text style={styles.courseTitle}>Portfolio Management</Text>
          <Text style={styles.courseDescription}>Build and manage diversified investment portfolios</Text>
          <Text style={styles.coursePrice}>$149.99</Text>
          <Button 
            title="Enroll Now"
            onPress={() => console.log('Navigate to course details')}
            style={styles.enrollButton}
          />
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
  courseCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 12,
  },
  enrollButton: {
    marginTop: 8,
  },
});