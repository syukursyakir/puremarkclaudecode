import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { getProfile, getScanHistory } from '@/services/storage';

type DietType = 'halal' | 'kosher' | 'vegan' | 'vegetarian' | 'pescetarian';

const dietLabels: Record<DietType, { label: string; emoji: string }> = {
  halal: { label: 'Halal', emoji: '🌙' },
  kosher: { label: 'Kosher', emoji: '✡️' },
  vegan: { label: 'Vegan', emoji: '🌱' },
  vegetarian: { label: 'Vegetarian', emoji: '🥗' },
  pescetarian: { label: 'Pescetarian', emoji: '🐟' },
};

export default function ScanScreen() {
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

  const handleScanWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan ingredients.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/crop-image',
        params: { imageUri: result.assets[0].uri },
      });
    }
  };

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to upload images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/crop-image',
        params: { imageUri: result.assets[0].uri },
      });
    }
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
          <View style={styles.logoMini}>
            <Text style={styles.logoMiniText}>Pm</Text>
          </View>
          <Text style={styles.brandName}>PureMark</Text>
        </View>

        {/* Primary Status Card - Like CalAI's calorie display */}
        <View style={styles.statusCard}>
          {userDiet ? (
            <>
              <Text style={styles.statusEmoji}>{dietLabels[userDiet].emoji}</Text>
              <Text style={styles.statusLabel}>Scanning for</Text>
              <Text style={styles.statusValue}>{dietLabels[userDiet].label}</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusEmoji}>🍽️</Text>
              <Text style={styles.statusLabel}>Scanning</Text>
              <Text style={styles.statusValue}>All Ingredients</Text>
            </>
          )}

          {/* Secondary Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalScans}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{allergenCount}</Text>
              <Text style={styles.statLabel}>Allergens tracked</Text>
            </View>
          </View>
        </View>

        {/* Scan Actions */}
        <Text style={styles.sectionLabel}>SCAN INGREDIENTS</Text>

        {/* Scan with Camera Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.cameraButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleScanWithCamera}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="camera" size={22} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.cameraButtonTitle}>Scan with Camera</Text>
            <Text style={styles.cameraButtonSubtitle}>Take a photo of ingredients</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>

        {/* Upload Image Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.uploadButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleUploadImage}
        >
          <View style={styles.uploadIconContainer}>
            <Ionicons name="image-outline" size={22} color={Colors.gray600} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.uploadButtonTitle}>Upload Image</Text>
            <Text style={styles.uploadButtonSubtitle}>Choose from gallery</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </Pressable>

        {/* Quick Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color={Colors.gray500} />
          <Text style={styles.tipText}>
            For best results, ensure the ingredient list is clearly visible and well-lit
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
    marginBottom: Spacing.lg,
  },
  logoMini: {
    width: 36,
    height: 36,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoMiniText: {
    fontSize: 16,
    fontWeight: '300',
    color: Colors.white,
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.5,
  },

  // Status Card (CalAI style primary metric)
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.gray500,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
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

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
  },
  cameraButton: {
    backgroundColor: Colors.black,
  },
  uploadButton: {
    backgroundColor: Colors.white,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  uploadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  cameraButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  cameraButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  uploadButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  uploadButtonSubtitle: {
    fontSize: 13,
    color: Colors.gray500,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 18,
  },
});
