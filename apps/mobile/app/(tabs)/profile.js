import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    occupation: 'Financial Analyst',
    experience: 'Intermediate',
    location: 'New York, NY'
  });

  const [editProfile, setEditProfile] = useState(profile);

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Courses Completed', value: '12', icon: 'school' },
    { label: 'Certificates Earned', value: '8', icon: 'workspace-premium' },
    { label: 'Study Hours', value: '156', icon: 'schedule' },
    { label: 'Current Streak', value: '15 days', icon: 'local-fire-department' }
  ];

  const achievements = [
    { title: 'First Course Complete', description: 'Completed your first course', earned: true },
    { title: 'Quick Learner', description: 'Finished 5 courses in a month', earned: true },
    { title: 'Market Expert', description: 'Aced all market analysis quizzes', earned: true },
    { title: 'Consistency Champion', description: 'Study for 30 days straight', earned: false },
    { title: 'Premium Learner', description: 'Completed 20 courses', earned: false }
  ];

  const settings = [
    { label: 'Notifications', icon: 'notifications', type: 'toggle' },
    { label: 'Dark Mode', icon: 'dark-mode', type: 'toggle' },
    { label: 'Language', icon: 'language', type: 'navigation', value: 'English' },
    { label: 'Privacy Settings', icon: 'privacy-tip', type: 'navigation' },
    { label: 'Help & Support', icon: 'help', type: 'navigation' },
    { label: 'About', icon: 'info', type: 'navigation' }
  ];

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <MaterialIcons name="person" size={60} color="#0ea5e9" />
          </View>
          <TouchableOpacity style={styles.editImageButton} data-testid="button-edit-profile-image">
            <MaterialIcons name="camera-alt" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} data-testid="text-profile-name">{profile.name}</Text>
          <Text style={styles.profileEmail} data-testid="text-profile-email">{profile.email}</Text>
          <View style={styles.experienceBadge}>
            <Text style={styles.experienceText}>{profile.experience}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
          data-testid="button-edit-profile"
        >
          <MaterialIcons name={isEditing ? "close" : "edit"} size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Section */}
      {isEditing && (
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editProfile.name}
              onChangeText={(text) => setEditProfile({...editProfile, name: text})}
              placeholder="Enter your full name"
              data-testid="input-profile-name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={editProfile.email}
              onChangeText={(text) => setEditProfile({...editProfile, email: text})}
              placeholder="Enter your email"
              keyboardType="email-address"
              data-testid="input-profile-email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.textInput}
              value={editProfile.phone}
              onChangeText={(text) => setEditProfile({...editProfile, phone: text})}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              data-testid="input-profile-phone"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Occupation</Text>
            <TextInput
              style={styles.textInput}
              value={editProfile.occupation}
              onChangeText={(text) => setEditProfile({...editProfile, occupation: text})}
              placeholder="Enter your occupation"
              data-testid="input-profile-occupation"
            />
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} data-testid="button-cancel-edit">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} data-testid="button-save-profile">
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard} data-testid={`stat-card-${index}`}>
              <MaterialIcons name={stat.icon} size={24} color="#0ea5e9" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          {achievements.map((achievement, index) => (
            <View key={index} style={[styles.achievementCard, !achievement.earned && styles.achievementLocked]} data-testid={`achievement-${index}`}>
              <MaterialIcons 
                name={achievement.earned ? "emoji-events" : "lock"} 
                size={24} 
                color={achievement.earned ? "#fbbf24" : "#9ca3af"} 
              />
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, !achievement.earned && styles.achievementTitleLocked]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDescription, !achievement.earned && styles.achievementDescriptionLocked]}>
                  {achievement.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsList}>
          {settings.map((setting, index) => (
            <TouchableOpacity key={index} style={styles.settingItem} data-testid={`setting-${setting.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <MaterialIcons name={setting.icon} size={24} color="#6b7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                {setting.value && <Text style={styles.settingValue}>{setting.value}</Text>}
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} data-testid="button-sign-out">
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  experienceBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  experienceText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  editSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementContent: {
    flex: 1,
    marginLeft: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  achievementTitleLocked: {
    color: '#9ca3af',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  achievementDescriptionLocked: {
    color: '#9ca3af',
  },
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '500',
    marginLeft: 8,
  },
});