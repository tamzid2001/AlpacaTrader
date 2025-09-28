import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const handleNavigate = (route) => {
    router.push(route);
  };

  const progressData = {
    coursesCompleted: 8,
    totalCourses: 15,
    currentStreak: 12,
    studyHours: 156,
    certificatesEarned: 5
  };

  const recentActivity = [
    { id: 1, type: 'course', title: 'Completed Advanced Trading Strategies', time: '2 hours ago' },
    { id: 2, type: 'quiz', title: 'Aced Market Analysis Quiz', time: '1 day ago' },
    { id: 3, type: 'certificate', title: 'Earned Risk Management Certificate', time: '3 days ago' },
    { id: 4, type: 'course', title: 'Started Portfolio Management', time: '5 days ago' }
  ];

  const quickActions = [
    { title: 'Browse Courses', icon: 'school', color: '#0ea5e9', route: '/courses' },
    { title: 'Market Data', icon: 'trending-up', color: '#10b981', route: '/market' },
    { title: 'AI Assistant', icon: 'chat', color: '#8b5cf6', route: '/chat' },
    { title: 'My Profile', icon: 'person', color: '#f59e0b', route: '/profile' }
  ];

  const marketHighlights = [
    { symbol: 'S&P 500', value: '4,567.89', change: '+0.85%', positive: true },
    { symbol: 'NASDAQ', value: '14,234.56', change: '+1.23%', positive: true },
    { symbol: 'DOW', value: '34,567.12', change: '-0.42%', positive: false }
  ];

  const featuredCourses = [
    { id: 1, title: 'Options Trading Fundamentals', progress: 0, duration: '6 hours' },
    { id: 2, title: 'Cryptocurrency Basics', progress: 30, duration: '4 hours' },
    { id: 3, title: 'Technical Analysis', progress: 75, duration: '8 hours' }
  ];

  const completionPercentage = Math.round((progressData.coursesCompleted / progressData.totalCourses) * 100);

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Good Morning!</Text>
          <Text style={styles.userName}>John Smith</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} data-testid="button-notifications">
          <MaterialIcons name="notifications" size={24} color="#6b7280" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Progress Overview Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Learning Progress</Text>
          <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progressData.coursesCompleted}/{progressData.totalCourses}</Text>
            <Text style={styles.progressStatLabel}>Courses</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progressData.currentStreak}</Text>
            <Text style={styles.progressStatLabel}>Day Streak</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progressData.studyHours}h</Text>
            <Text style={styles.progressStatLabel}>Study Time</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progressData.certificatesEarned}</Text>
            <Text style={styles.progressStatLabel}>Certificates</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionButton, { backgroundColor: action.color }]}
              onPress={() => handleNavigate(action.route)}
              data-testid={`button-quick-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <MaterialIcons name={action.icon} size={24} color="#fff" />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Market Highlights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market Highlights</Text>
          <TouchableOpacity onPress={() => handleNavigate('/market')} data-testid="button-view-all-market">
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.marketGrid}>
          {marketHighlights.map((market, index) => (
            <View key={index} style={styles.marketCard} data-testid={`market-card-${index}`}>
              <Text style={styles.marketSymbol}>{market.symbol}</Text>
              <Text style={styles.marketValue}>{market.value}</Text>
              <Text style={[styles.marketChange, market.positive ? styles.marketPositive : styles.marketNegative]}>
                {market.change}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Featured Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <TouchableOpacity onPress={() => handleNavigate('/courses')} data-testid="button-view-all-courses">
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coursesList}>
          {featuredCourses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard} data-testid={`course-card-${course.id}`}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDuration}>{course.duration}</Text>
                
                <View style={styles.courseProgressContainer}>
                  <View style={styles.courseProgressBar}>
                    <View style={[styles.courseProgressFill, { width: `${course.progress}%` }]} />
                  </View>
                  <Text style={styles.courseProgressText}>{course.progress}%</Text>
                </View>
              </View>
              <MaterialIcons name="play-circle-outline" size={32} color="#0ea5e9" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem} data-testid={`activity-${activity.id}`}>
              <MaterialIcons 
                name={activity.type === 'course' ? 'school' : activity.type === 'quiz' ? 'quiz' : 'emoji-events'} 
                size={20} 
                color="#0ea5e9" 
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Study Goal Card */}
      <View style={styles.goalCard}>
        <MaterialIcons name="local-fire-department" size={32} color="#f59e0b" />
        <View style={styles.goalContent}>
          <Text style={styles.goalTitle}>Daily Study Goal</Text>
          <Text style={styles.goalDescription}>You're on a {progressData.currentStreak}-day streak! Keep it up!</Text>
          <TouchableOpacity style={styles.goalButton} data-testid="button-set-goal">
            <Text style={styles.goalButtonText}>Set New Goal</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
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
  },
  viewAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 60) / 2,
    aspectRatio: 1.5,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  marketGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marketCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  marketSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  marketValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 4,
  },
  marketChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  marketPositive: {
    color: '#10b981',
  },
  marketNegative: {
    color: '#ef4444',
  },
  coursesList: {
    gap: 12,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  courseDuration: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  courseProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  courseProgressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalContent: {
    flex: 1,
    marginLeft: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  goalButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  goalButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});