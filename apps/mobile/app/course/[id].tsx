import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';

export default function CourseScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Course Details</Text>
        <Text style={styles.courseId}>Course ID: {id}</Text>
        
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>Financial Markets 101</Text>
          <Text style={styles.courseDescription}>
            Master the fundamentals of financial markets, trading strategies, and risk management. 
            This comprehensive course covers everything from basic market mechanics to advanced 
            trading techniques.
          </Text>
          
          <View style={styles.courseDetails}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>8 weeks</Text>
          </View>
          
          <View style={styles.courseDetails}>
            <Text style={styles.detailLabel}>Level:</Text>
            <Text style={styles.detailValue}>Beginner</Text>
          </View>
          
          <View style={styles.courseDetails}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>$99.99</Text>
          </View>
        </View>

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Course Lessons</Text>
          
          <View style={styles.lessonCard}>
            <Text style={styles.lessonTitle}>1. Introduction to Financial Markets</Text>
            <Text style={styles.lessonDuration}>15 minutes</Text>
          </View>
          
          <View style={styles.lessonCard}>
            <Text style={styles.lessonTitle}>2. Market Structure and Participants</Text>
            <Text style={styles.lessonDuration}>20 minutes</Text>
          </View>
          
          <View style={styles.lessonCard}>
            <Text style={styles.lessonTitle}>3. Trading Basics</Text>
            <Text style={styles.lessonDuration}>25 minutes</Text>
          </View>
        </View>

        <Button
          title="Enroll in Course"
          onPress={() => console.log('Enroll in course')}
          style={styles.enrollButton}
        />
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
  courseId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  courseInfo: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  courseDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  lessonsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  lessonDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  enrollButton: {
    marginTop: 16,
  },
});