import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { getProfile, saveProfile } from '@/services/storage';
import { UserProfile } from '@/services/api';

interface DietaryOption {
  id: 'halal' | 'kosher';
  label: string;
  description: string;
}

const dietaryOptions: DietaryOption[] = [
  { id: 'halal', label: 'Halal', description: 'Check ingredients against Halal standards' },
  { id: 'kosher', label: 'Kosher', description: 'Check ingredients against Kosher standards' },
];

const allergenOptions = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
];

export default function ProfileScreen() {
  const [selectedDiet, setSelectedDiet] = useState<'halal' | 'kosher' | null>('halal');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-20)).current;

  // Load saved preferences on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      setSelectedDiet(profile.diet);
      setSelectedAllergens(profile.allergies);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistProfile = async (diet: 'halal' | 'kosher' | null, allergies: string[]) => {
    try {
      await saveProfile({ diet, allergies });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const showPreferencesUpdated = () => {
    setShowToast(true);
    
    // Animate in
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide after 2 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowToast(false);
      });
    }, 2000);
  };

  const handleDietToggle = (id: 'halal' | 'kosher') => {
    // Only allow one diet at a time - selecting one deselects the other
    const newDiet = selectedDiet === id ? null : id;
    setSelectedDiet(newDiet);
    persistProfile(newDiet, selectedAllergens);
    showPreferencesUpdated();
  };

  const handleAllergenToggle = (allergen: string) => {
    const newAllergens = selectedAllergens.includes(allergen)
      ? selectedAllergens.filter((a) => a !== allergen)
      : [...selectedAllergens, allergen];
    
    setSelectedAllergens(newAllergens);
    persistProfile(selectedDiet, newAllergens);
    showPreferencesUpdated();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Text style={styles.toastText}>Preferences updated</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Preferences</Text>
          <Text style={styles.headerSubtitle}>Customize your dietary requirements</Text>
        </View>

        {/* Dietary Requirements Section */}
        <Text style={styles.sectionTitle}>Dietary Requirements</Text>
        <View style={styles.card}>
          <Text style={styles.cardNote}>
            Select one dietary standard for ingredient analysis
          </Text>
          {dietaryOptions.map((option, index) => (
            <View key={option.id}>
              <View style={styles.dietaryRow}>
                <View style={styles.dietaryInfo}>
                  <Text style={styles.dietaryLabel}>{option.label}</Text>
                  <Text style={styles.dietaryDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={selectedDiet === option.id}
                  onValueChange={() => handleDietToggle(option.id)}
                  trackColor={{ false: Colors.gray300, true: '#7A9F7A' }}
                  thumbColor={Colors.white}
                />
              </View>
              {index < dietaryOptions.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Allergen Alerts Section */}
        <Text style={styles.sectionTitle}>Allergen Alerts</Text>
        <View style={styles.card}>
          <Text style={styles.allergenDescription}>
            Select allergens you want to be alerted about
          </Text>
          <View style={styles.allergenGrid}>
            {allergenOptions.map((allergen) => {
              const isSelected = selectedAllergens.includes(allergen);
              return (
                <Pressable
                  key={allergen}
                  style={[
                    styles.allergenPill,
                    isSelected && styles.allergenPillSelected,
                  ]}
                  onPress={() => handleAllergenToggle(allergen)}
                >
                  <Text
                    style={[
                      styles.allergenText,
                      isSelected && styles.allergenTextSelected,
                    ]}
                  >
                    {allergen}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.gray500} />
            <Text style={styles.infoTitle}>How It Works</Text>
          </View>
          <Text style={styles.infoText}>
            Your preferences are used by our AI-powered analysis system to evaluate ingredients. 
            The system checks each ingredient against your selected dietary requirements and 
            allergen concerns, providing detailed compliance information for every scan.
          </Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.versionLabel}>Version</Text>
          <Text style={styles.versionValue}>1.0.0 (Prototype)</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray500,
  },
  toast: {
    position: 'absolute',
    top: 100,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: '#7A9F7A',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    zIndex: 100,
    alignSelf: 'center',
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  cardNote: {
    fontSize: 13,
    color: Colors.gray500,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  dietaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  dietaryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  dietaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  dietaryDescription: {
    fontSize: 13,
    color: Colors.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.sm,
  },
  allergenDescription: {
    fontSize: 14,
    color: Colors.gray500,
    marginBottom: Spacing.md,
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allergenPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  allergenPillSelected: {
    backgroundColor: '#C4A574',
    borderColor: '#C4A574',
  },
  allergenText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  allergenTextSelected: {
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginLeft: Spacing.sm,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    lineHeight: 20,
  },
  versionLabel: {
    fontSize: 13,
    color: Colors.gray500,
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
});
