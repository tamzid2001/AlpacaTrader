import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JS</Text>
          </View>
          <Text style={styles.name}>John Student</Text>
          <Text style={styles.email}>john.student@example.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Courses Completed</Text>
            <Text style={styles.progressValue}>3 of 8</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Certificates Earned</Text>
            <Text style={styles.progressValue}>2</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Study Hours</Text>
            <Text style={styles.progressValue}>24.5 hours</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Button
            title="Edit Profile"
            onPress={() => console.log('Edit Profile')}
            variant="secondary"
            style={styles.settingsButton}
          />
          <Button
            title="Notification Settings"
            onPress={() => console.log('Notification Settings')}
            variant="secondary"
            style={styles.settingsButton}
          />
          <Button
            title="Privacy Settings"
            onPress={() => console.log('Privacy Settings')}
            variant="secondary"
            style={styles.settingsButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>Premium Plan</Text>
            <Text style={styles.subscriptionStatus}>Active until Mar 15, 2024</Text>
            <Button
              title="Manage Subscription"
              onPress={() => console.log('Manage Subscription')}
              style={styles.manageButton}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={() => console.log('Sign Out')}
            variant="secondary"
            style={styles.signOutButton}
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  progressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#374151',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  settingsButton: {
    marginBottom: 8,
  },
  subscriptionCard: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#1e40af',
  },
  signOutButton: {
    backgroundColor: '#dc2626',
  },
});