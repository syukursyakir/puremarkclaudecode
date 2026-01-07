import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function DashboardScreen() {
  const handleScanPress = () => {
    router.navigate('/(tabs)/scan');
  };

  const handleFeedbackPress = () => {
    router.navigate('/(tabs)/feedback');
  };

  const handleHistoryPress = () => {
    router.navigate('/(tabs)/history');
  };

  const handleProfilePress = () => {
    router.navigate('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PureMark</Text>
          <Text style={styles.headerSubtitle}>Certification-grade food analysis</Text>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to PureMark</Text>
          <Text style={styles.welcomeText}>
            Analyze ingredients, verify certifications, and make informed choices.
          </Text>
        </View>

        {/* Scan Ingredients Button */}
        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.scanButtonPressed,
          ]}
          onPress={handleScanPress}
        >
          <View style={styles.scanIconContainer}>
            <Ionicons name="camera-outline" size={24} color={Colors.white} />
          </View>
          <View style={styles.scanContent}>
            <Text style={styles.scanTitle}>Scan Ingredients</Text>
            <Text style={styles.scanSubtitle}>Take or upload a photo to analyze</Text>
          </View>
        </Pressable>

        {/* Action Tiles */}
        <View style={styles.tilesContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.tilePressed,
            ]}
            onPress={handleFeedbackPress}
          >
            <View style={styles.tileIconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color={Colors.gray600} />
            </View>
            <Text style={styles.tileLabel}>Feedback</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.tilePressed,
            ]}
            onPress={handleHistoryPress}
          >
            <View style={styles.tileIconContainer}>
              <Ionicons name="time-outline" size={24} color={Colors.gray600} />
            </View>
            <Text style={styles.tileLabel}>History</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.tilePressed,
            ]}
            onPress={handleProfilePress}
          >
            <View style={styles.tileIconContainer}>
              <Ionicons name="person-outline" size={24} color={Colors.gray600} />
            </View>
            <Text style={styles.tileLabel}>Profile</Text>
          </Pressable>
        </View>

        {/* Food Transparency Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.gray600} />
            </View>
            <Text style={styles.tipsTitle}>Food Transparency Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Check ingredient lists for additives that may not meet certification standards
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Verify certification logos with their official issuing bodies when possible
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                E-numbers and natural flavors may require additional verification for compliance
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  welcomeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    ...Typography.body,
    color: Colors.gray600,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scanButtonPressed: {
    opacity: 0.9,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  scanContent: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  tilesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  tilePressed: {
    opacity: 0.8,
  },
  tileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipsIconContainer: {
    marginRight: Spacing.sm,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray400,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    flex: 1,
    lineHeight: 20,
  },
});
