import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function ScanScreen() {
  const handleScanWithCamera = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan ingredients. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch camera (no editing - we'll crop in our custom screen)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]) {
      // Navigate to crop screen
      router.push({
        pathname: '/crop-image',
        params: { imageUri: result.assets[0].uri },
      });
    }
  };

  const handleUploadImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to upload images. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch image picker (no editing - we'll crop in our custom screen)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      // Navigate to crop screen
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ingredient Scan</Text>
          <Text style={styles.headerSubtitle}>Certification-grade ingredient analysis</Text>
        </View>

        {/* Ready to Scan Card */}
        <View style={styles.readyCard}>
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera-outline" size={32} color={Colors.gray600} />
          </View>
          <Text style={styles.readyTitle}>Ready to Scan</Text>
          <Text style={styles.readySubtitle}>
            Select an input method to begin certification analysis
          </Text>
        </View>

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
            <Ionicons name="camera" size={20} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.cameraButtonTitle]}>Scan with Camera</Text>
            <Text style={[styles.actionSubtitle, styles.cameraButtonSubtitle]}>Take a photo to analyze</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
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
            <Ionicons name="image-outline" size={20} color={Colors.gray600} />
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, styles.uploadButtonTitle]}>Upload Image</Text>
            <Text style={[styles.actionSubtitle, styles.uploadButtonSubtitle]}>Choose from gallery</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </Pressable>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsTitle}>Tips for Best Results</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Ensure the ingredient list is clearly visible and in focus
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Use good lighting to avoid shadows on the label
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Capture the entire ingredient section for accurate analysis
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  readyCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  readyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  readySubtitle: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  cameraButton: {
    backgroundColor: Colors.gray800,
  },
  uploadButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  cameraButtonTitle: {
    color: Colors.white,
  },
  cameraButtonSubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  uploadButtonTitle: {
    color: Colors.black,
  },
  uploadButtonSubtitle: {
    color: Colors.gray500,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipsIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  tipsList: {
    gap: Spacing.sm,
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
