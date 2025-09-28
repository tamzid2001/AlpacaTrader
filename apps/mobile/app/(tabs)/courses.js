import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [enrolledCourses, setEnrolledCourses] = useState(new Set([1, 3])); // Mock enrolled courses

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Premium'];

  const allCourses = [
    {
      id: 1,
      title: 'Financial Markets 101',
      description: 'Learn the fundamentals of financial markets, including stocks, bonds, and basic trading concepts.',
      instructor: 'Dr. Sarah Johnson',
      duration: '6 hours',
      lessons: 24,
      level: 'Beginner',
      rating: 4.8,
      students: 1250,
      price: 'Free',
      isPremium: false,
      progress: 75,
      thumbnail: '📈'
    },
    {
      id: 2,
      title: 'Advanced Trading Strategies',
      description: 'Master complex trading strategies including options, futures, and algorithmic trading techniques.',
      instructor: 'Prof. Michael Chen',
      duration: '12 hours',
      lessons: 45,
      level: 'Advanced',
      rating: 4.9,
      students: 850,
      price: '$199',
      isPremium: true,
      progress: 0,
      thumbnail: '💹'
    },
    {
      id: 3,
      title: 'Risk Management Essentials',
      description: 'Understand and implement effective risk management strategies for your investment portfolio.',
      instructor: 'Lisa Rodriguez',
      duration: '8 hours',
      lessons: 32,
      level: 'Intermediate',
      rating: 4.7,
      students: 920,
      price: '$99',
      isPremium: false,
      progress: 40,
      thumbnail: '🛡️'
    },
    {
      id: 4,
      title: 'Cryptocurrency Fundamentals',
      description: 'Explore the world of digital currencies, blockchain technology, and crypto trading basics.',
      instructor: 'David Kim',
      duration: '5 hours',
      lessons: 20,
      level: 'Beginner',
      rating: 4.6,
      students: 1540,
      price: '$79',
      isPremium: false,
      progress: 0,
      thumbnail: '₿'
    },
    {
      id: 5,
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis tools for better trading decisions.',
      instructor: 'Robert Taylor',
      duration: '10 hours',
      lessons: 38,
      level: 'Intermediate',
      rating: 4.8,
      students: 750,
      price: '$149',
      isPremium: true,
      progress: 0,
      thumbnail: '📊'
    },
    {
      id: 6,
      title: 'Portfolio Management Pro',
      description: 'Learn professional portfolio construction, asset allocation, and optimization techniques.',
      instructor: 'Amanda Foster',
      duration: '14 hours',
      lessons: 52,
      level: 'Advanced',
      rating: 4.9,
      students: 680,
      price: '$299',
      isPremium: true,
      progress: 0,
      thumbnail: '📚'
    }
  ];

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.level === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnrollment = (courseId, courseTitle, price) => {
    if (enrolledCourses.has(courseId)) {
      Alert.alert('Already Enrolled', `You are already enrolled in "${courseTitle}"`);
      return;
    }

    if (price === 'Free') {
      setEnrolledCourses(prev => new Set([...prev, courseId]));
      Alert.alert('Enrollment Successful!', `You have successfully enrolled in "${courseTitle}"`);
    } else {
      Alert.alert(
        'Confirm Purchase',
        `Would you like to enroll in "${courseTitle}" for ${price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enroll Now', 
            onPress: () => {
              setEnrolledCourses(prev => new Set([...prev, courseId]));
              Alert.alert('Enrollment Successful!', `You have successfully enrolled in "${courseTitle}"`);
            }
          }
        ]
      );
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={i} name="star" size={12} color="#fbbf24" />);
    }
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={12} color="#fbbf24" />);
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        <Text style={styles.subtitle}>Master financial markets with expert-led courses</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses, instructors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          data-testid="input-search-courses"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} data-testid="button-clear-search">
            <MaterialIcons name="clear" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
            data-testid={`button-category-${category.toLowerCase()}`}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Course List */}
      <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false}>
        {filteredCourses.map((course) => {
          const isEnrolled = enrolledCourses.has(course.id);
          
          return (
            <View key={course.id} style={styles.courseCard} data-testid={`course-card-${course.id}`}>
              {/* Course Header */}
              <View style={styles.courseHeader}>
                <View style={styles.courseThumbnail}>
                  <Text style={styles.thumbnailEmoji}>{course.thumbnail}</Text>
                </View>
                
                <View style={styles.courseInfo}>
                  <View style={styles.courseTitleRow}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                    {course.isPremium && (
                      <View style={styles.premiumBadge}>
                        <MaterialIcons name="workspace-premium" size={14} color="#fbbf24" />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.courseInstructor}>by {course.instructor}</Text>
                  
                  <View style={styles.courseRating}>
                    <View style={styles.stars}>
                      {renderStars(course.rating)}
                    </View>
                    <Text style={styles.ratingText}>{course.rating}</Text>
                    <Text style={styles.studentsText}>({course.students} students)</Text>
                  </View>
                </View>
              </View>

              {/* Course Description */}
              <Text style={styles.courseDescription} numberOfLines={3}>
                {course.description}
              </Text>

              {/* Course Details */}
              <View style={styles.courseDetails}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="schedule" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{course.duration}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="play-lesson" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{course.lessons} lessons</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialIcons name="trending-up" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{course.level}</Text>
                </View>
              </View>

              {/* Progress Bar (if enrolled) */}
              {isEnrolled && course.progress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressPercentage}>{course.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.courseActions}>
                <View style={styles.priceContainer}>
                  <Text style={[
                    styles.priceText,
                    course.price === 'Free' && styles.freePrice
                  ]}>
                    {course.price}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.enrollButton,
                    isEnrolled && styles.enrolledButton
                  ]}
                  onPress={() => {
                    if (isEnrolled) {
                      Alert.alert('Continue Learning', `Resume "${course.title}"?`);
                    } else {
                      handleEnrollment(course.id, course.title, course.price);
                    }
                  }}
                  data-testid={`button-${isEnrolled ? 'continue' : 'enroll'}-${course.id}`}
                >
                  <MaterialIcons 
                    name={isEnrolled ? "play-arrow" : "add"} 
                    size={16} 
                    color={isEnrolled ? "#0ea5e9" : "#fff"} 
                  />
                  <Text style={[
                    styles.enrollButtonText,
                    isEnrolled && styles.enrolledButtonText
                  ]}>
                    {isEnrolled ? 'Continue' : 'Enroll Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No courses found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#fff',
  },
  coursesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  courseThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  thumbnailEmoji: {
    fontSize: 28,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  premiumBadge: {
    marginLeft: 8,
    marginTop: 2,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  courseRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  studentsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  freePrice: {
    color: '#10b981',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  enrolledButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  enrolledButtonText: {
    color: '#0ea5e9',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});