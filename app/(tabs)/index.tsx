import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { getProfile, getScanHistory } from '@/services/storage';

type DietType = 'halal' | 'kosher' | 'vegan' | 'vegetarian' | 'pescetarian';

const dietInfo: Record<DietType, { label: string; emoji: string }> = {
  halal: { label: 'Halal', emoji: '🌙' },
  kosher: { label: 'Kosher', emoji: '✡️' },
  vegan: { label: 'Vegan', emoji: '🌱' },
  vegetarian: { label: 'Vegetarian', emoji: '🥗' },
  pescetarian: { label: 'Pescetarian', emoji: '🐟' },
};

export default function DashboardScreen() {
  const [userDiet, setUserDiet] = useState<DietType | null>(null);
  const [totalScans, setTotalScans] = useState(0);
  const [allergenCount, setAllergenCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const [profile, history] = await Promise.all([
        getProfile(),
        getScanHistory(),
      ]);
      setUserDiet(profile.diet as DietType | null);
      setAllergenCount(profile.allergies?.length || 0);
      setTotalScans(history.length);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleScanPress = () => {
    router.navigate('/(tabs)/scan');
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
        {/* Header - CalAI Style */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Pm</Text>
          </View>
          <Text style={styles.brandName}>PureMark</Text>
        </View>

        {/* Primary Status Card */}
        <View style={styles.statusCard}>
          {userDiet ? (
            <>
              <Text style={styles.statusEmoji}>{dietInfo[userDiet].emoji}</Text>
              <Text style={styles.statusLabel}>Your diet</Text>
              <Text style={styles.statusValue}>{dietInfo[userDiet].label}</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusEmoji}>🍽️</Text>
              <Text style={styles.statusLabel}>Your diet</Text>
              <Text style={styles.statusValue}>No preference</Text>
            </>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalScans}</Text>
              <Text style={styles.statLabel}>Total scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allergenCount}</Text>
              <Text style={styles.statLabel}>Allergens</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        {/* Scan Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.scanCard,
            pressed && styles.cardPressed,
          ]}
          onPress={handleScanPress}
        >
          <View style={styles.scanIconContainer}>
            <Ionicons name="scan" size={28} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.scanTitle}>Scan Ingredients</Text>
            <Text style={styles.scanSubtitle}>Camera or gallery</Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>

        {/* Action Tiles Row */}
        <View style={styles.tilesRow}>
          <Pressable
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.cardPressed,
            ]}
            onPress={handleHistoryPress}
          >
            <View style={styles.tileIcon}>
              <Ionicons name="time-outline" size={24} color={Colors.gray700} />
            </View>
            <Text style={styles.tileTitle}>History</Text>
            <Text style={styles.tileSubtitle}>{totalScans} scans</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.cardPressed,
            ]}
            onPress={handleProfilePress}
          >
            <View style={styles.tileIcon}>
              <Ionicons name="person-outline" size={24} color={Colors.gray700} />
            </View>
            <Text style={styles.tileTitle}>Profile</Text>
            <Text style={styles.tileSubtitle}>Settings</Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.gray500} />
          <Text style={styles.infoText}>
            Scan ingredient lists to check compliance with your dietary preferences
          </Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.white,
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.5,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.gray500,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.gray200,
  },

  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray500,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.md,
  },
  scanCard: {
    backgroundColor: Colors.black,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  scanIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
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
    color: 'rgba(255,255,255,0.6)',
  },

  // Tiles
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 13,
    color: Colors.gray500,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 18,
  },
});
