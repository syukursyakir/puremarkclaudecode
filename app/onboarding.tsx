import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DotIndicator } from '@/components/onboarding/DotIndicator';
import { useOnboarding } from '@/hooks/useOnboarding';
import { saveProfile } from '@/services/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type DietType = 'halal' | 'kosher' | 'vegan' | 'vegetarian' | 'pescetarian';

interface DietOption {
  id: DietType;
  label: string;
  emoji: string;
  description: string;
}

const dietOptions: DietOption[] = [
  { id: 'halal', label: 'Halal', emoji: '🌙', description: 'Islamic dietary standards' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️', description: 'Jewish dietary laws' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱', description: 'No animal products' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗', description: 'No meat or fish' },
  { id: 'pescetarian', label: 'Pescetarian', emoji: '🐟', description: 'Fish allowed, no meat' },
];

const allergenOptions = [
  { name: 'Peanuts', emoji: '🥜' },
  { name: 'Tree Nuts', emoji: '🌰' },
  { name: 'Milk', emoji: '🥛' },
  { name: 'Eggs', emoji: '🥚' },
  { name: 'Fish', emoji: '🐟' },
  { name: 'Shellfish', emoji: '🦐' },
  { name: 'Soy', emoji: '🫘' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Sesame', emoji: '🫓' },
];

const TOTAL_SLIDES = 6;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);

  // User selections
  const [selectedDiet, setSelectedDiet] = useState<DietType | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const goToNextSlide = () => {
    if (activeIndex < TOTAL_SLIDES - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      // Save preferences first
      await saveProfile({
        diet: selectedDiet,
        allergies: selectedAllergens,
      });
      await signInWithGoogle();
      await completeOnboarding();
      router.replace('/(tabs)/scan');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    // Save preferences
    await saveProfile({
      diet: selectedDiet,
      allergies: selectedAllergens,
    });
    continueAsGuest();
    await completeOnboarding();
    router.replace('/(tabs)/scan');
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  // Slide 1: Welcome
  const WelcomeSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Pm</Text>
        </View>
      </View>
      <View style={styles.middleSection}>
        <Text style={styles.mainTitle}>Scan Ingredients{'\n'}Decide With Confidence</Text>
        <Text style={styles.mainSubtitle}>AI-powered ingredient verification</Text>
        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Real-time AI breakdown</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Dietary & certification compliance checks</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Transparent ingredient explanations</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>
        <Pressable style={styles.button} onPress={goToNextSlide}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );

  // Slide 2: Feature - AI Analyst
  const FeatureSlide1 = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topSection}>
        <Text style={styles.arrowText}>→</Text>
      </View>
      <View style={styles.middleSection}>
        <Text style={styles.mainTitle}>AI Ingredient Analyst</Text>
        <Text style={styles.mainSubtitle}>
          Automatically analyzes ingredient lists using your dietary preferences and certification rules.
        </Text>
        <View style={styles.tagsContainer}>
          <Text style={styles.tagText}>Personalized</Text>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>Certification-Grade</Text>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>AI-Powered</Text>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>
        <Pressable style={styles.button} onPress={goToNextSlide}>
          <Text style={styles.buttonText}>Next Feature</Text>
        </Pressable>
      </View>
    </View>
  );

  // Slide 3: Feature - Accurate Scanning
  const FeatureSlide2 = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topSection}>
        <Text style={styles.arrowText}>→</Text>
      </View>
      <View style={styles.middleSection}>
        <Text style={styles.mainTitle}>Accurate Ingredient Scanning</Text>
        <Text style={styles.mainSubtitle}>
          Uses AI to detect and scan ingredients to get the most accurate results.
        </Text>
        <View style={styles.tagsContainer}>
          <Text style={styles.tagText}>Accurate</Text>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>AI-Powered</Text>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>Reliable</Text>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>
        <Pressable style={styles.button} onPress={goToNextSlide}>
          <Text style={styles.buttonText}>Set Up Profile</Text>
        </Pressable>
      </View>
    </View>
  );

  // Slide 4: Diet Selection
  const DietSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideHeader}>
        <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
        <Text style={styles.slideTitle}>What's your diet?</Text>
        <Text style={styles.slideSubtitle}>
          We'll check ingredients against your dietary requirements
        </Text>
      </View>
      <ScrollView
        style={styles.optionsScrollView}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {dietOptions.map((option) => {
          const isSelected = selectedDiet === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.dietOption, isSelected && styles.dietOptionSelected]}
              onPress={() => setSelectedDiet(option.id)}
            >
              <Text style={styles.dietEmoji}>{option.emoji}</Text>
              <View style={styles.dietInfo}>
                <Text style={[styles.dietLabel, isSelected && styles.dietLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.dietDescription}>{option.description}</Text>
              </View>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.dietOption, selectedDiet === null && styles.dietOptionSelected]}
          onPress={() => setSelectedDiet(null)}
        >
          <Text style={styles.dietEmoji}>🍽️</Text>
          <View style={styles.dietInfo}>
            <Text style={[styles.dietLabel, selectedDiet === null && styles.dietLabelSelected]}>
              No specific diet
            </Text>
            <Text style={styles.dietDescription}>Skip dietary restrictions</Text>
          </View>
          <View style={[styles.radioOuter, selectedDiet === null && styles.radioOuterSelected]}>
            {selectedDiet === null && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      </ScrollView>
      <View style={styles.bottomSection}>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>
        <Pressable style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  // Slide 5: Allergen Selection
  const AllergenSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideHeader}>
        <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
        <Text style={styles.slideTitle}>Any allergies?</Text>
        <Text style={styles.slideSubtitle}>
          We'll warn you when these ingredients are detected
        </Text>
      </View>
      <ScrollView
        style={styles.optionsScrollView}
        contentContainerStyle={styles.allergenGrid}
        showsVerticalScrollIndicator={false}
      >
        {allergenOptions.map((allergen) => {
          const isSelected = selectedAllergens.includes(allergen.name);
          return (
            <Pressable
              key={allergen.name}
              style={[styles.allergenOption, isSelected && styles.allergenOptionSelected]}
              onPress={() => toggleAllergen(allergen.name)}
            >
              <Text style={styles.allergenEmoji}>{allergen.emoji}</Text>
              <Text style={[styles.allergenLabel, isSelected && styles.allergenLabelSelected]}>
                {allergen.name}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.bottomSection}>
        <Text style={styles.skipHint}>
          {selectedAllergens.length === 0
            ? 'Tap allergens to select, or skip if none'
            : `${selectedAllergens.length} allergen${selectedAllergens.length > 1 ? 's' : ''} selected`}
        </Text>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>
        <Pressable style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>
            {selectedAllergens.length === 0 ? 'Skip' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  // Slide 6: Auth Slide
  const AuthSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.authContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Pm</Text>
        </View>
        <Text style={styles.authTitle}>You're all set!</Text>
        <Text style={styles.authSubtitle}>
          Sign in to sync your data across devices, or continue as a guest.
        </Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Diet</Text>
            <Text style={styles.summaryValue}>
              {selectedDiet
                ? dietOptions.find((d) => d.id === selectedDiet)?.label
                : 'None'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Allergens</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {selectedAllergens.length > 0
                ? selectedAllergens.length > 2
                  ? `${selectedAllergens.slice(0, 2).join(', ')} +${selectedAllergens.length - 2}`
                  : selectedAllergens.join(', ')
                : 'None'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.authButtonsSection}>
        <View style={styles.dotsWrapper}>
          <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={Colors.white} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.guestNote}>
          Your data will be stored locally on this device only
        </Text>
      </View>
    </View>
  );

  const slides = [
    { key: 'welcome', component: WelcomeSlide },
    { key: 'feature1', component: FeatureSlide1 },
    { key: 'feature2', component: FeatureSlide2 },
    { key: 'diet', component: DietSlide },
    { key: 'allergen', component: AllergenSlide },
    { key: 'auth', component: AuthSlide },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray100} />

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <item.component />}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        scrollEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },

  // Original onboarding layout
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  bottomSection: {
    paddingTop: Spacing.sm,
  },
  dotsWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // Logo
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.gray700,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '300',
    color: Colors.white,
    letterSpacing: -2,
  },
  arrowText: {
    fontSize: 48,
    color: Colors.gray400,
  },

  // Main text
  mainTitle: {
    ...Typography.h2,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  mainSubtitle: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Features list
  featureList: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray400,
    marginTop: 10,
    marginRight: Spacing.sm,
  },
  featureText: {
    ...Typography.bodySmall,
    color: Colors.gray600,
    flex: 1,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.gray500,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    marginHorizontal: Spacing.sm,
  },

  // Button
  button: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.button,
    color: Colors.black,
  },

  // Setup slides header
  slideHeader: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A9F7A',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  slideSubtitle: {
    fontSize: 14,
    color: Colors.gray500,
    lineHeight: 20,
  },

  // Options
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dietOptionSelected: {
    borderColor: '#7A9F7A',
    backgroundColor: '#F5FAF5',
  },
  dietEmoji: {
    fontSize: 26,
    marginRight: Spacing.md,
  },
  dietInfo: {
    flex: 1,
  },
  dietLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  dietLabelSelected: {
    color: '#4A7A4A',
  },
  dietDescription: {
    fontSize: 12,
    color: Colors.gray500,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7A9F7A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7A9F7A',
  },

  // Allergen grid
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  allergenOption: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  allergenOptionSelected: {
    borderColor: '#C4A574',
    backgroundColor: '#FEF8F0',
  },
  allergenEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  allergenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray600,
    textAlign: 'center',
  },
  allergenLabelSelected: {
    color: '#8B6914',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipHint: {
    fontSize: 12,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // Primary button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },

  // Auth slide
  authContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray500,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.sm,
  },

  // Auth buttons
  authButtonsSection: {
    paddingTop: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray300,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.gray500,
    marginHorizontal: Spacing.md,
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  guestNote: {
    fontSize: 11,
    color: Colors.gray400,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
