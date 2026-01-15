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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DotIndicator } from '@/components/onboarding/DotIndicator';
import { useOnboarding } from '@/hooks/useOnboarding';
import { saveProfile } from '@/services/storage';
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

const TOTAL_SLIDES = 4;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();

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

  const handleComplete = async () => {
    // Save user preferences
    await saveProfile({
      diet: selectedDiet,
      allergies: selectedAllergens,
    });
    // Mark onboarding complete
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
      <View style={styles.slideContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Pm</Text>
        </View>
        <Text style={styles.welcomeTitle}>Welcome to PureMark</Text>
        <Text style={styles.welcomeSubtitle}>
          AI-powered ingredient scanning{'\n'}for your dietary needs
        </Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="scan-outline" size={24} color={Colors.gray600} />
            <Text style={styles.featureText}>Scan any ingredient list</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Colors.gray600} />
            <Text style={styles.featureText}>Instant compliance check</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="warning-outline" size={24} color={Colors.gray600} />
            <Text style={styles.featureText}>Allergen alerts</Text>
          </View>
        </View>
      </View>
      <View style={styles.slideFooter}>
        <Pressable style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  // Slide 2: Diet Selection
  const DietSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideHeader}>
        <Text style={styles.stepLabel}>Step 1 of 2</Text>
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
      <View style={styles.slideFooter}>
        <Pressable style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  // Slide 3: Allergen Selection
  const AllergenSlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideHeader}>
        <Text style={styles.stepLabel}>Step 2 of 2</Text>
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
      <View style={styles.slideFooter}>
        <Text style={styles.skipHint}>
          {selectedAllergens.length === 0
            ? 'Tap allergens to select, or skip if none'
            : `${selectedAllergens.length} allergen${selectedAllergens.length > 1 ? 's' : ''} selected`
          }
        </Text>
        <Pressable style={styles.primaryButton} onPress={goToNextSlide}>
          <Text style={styles.primaryButtonText}>
            {selectedAllergens.length === 0 ? 'Skip' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );

  // Slide 4: Ready to Scan
  const ReadySlide = () => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={styles.readyIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#7A9F7A" />
        </View>
        <Text style={styles.readyTitle}>You're all set!</Text>
        <Text style={styles.readySubtitle}>
          Your preferences have been saved.{'\n'}Start scanning ingredients now.
        </Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Diet:</Text>
            <Text style={styles.summaryValue}>
              {selectedDiet
                ? dietOptions.find(d => d.id === selectedDiet)?.label
                : 'None selected'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Allergens:</Text>
            <Text style={styles.summaryValue}>
              {selectedAllergens.length > 0
                ? selectedAllergens.join(', ')
                : 'None selected'}
            </Text>
          </View>
        </View>

        <Text style={styles.editHint}>
          You can change these anytime in Settings
        </Text>
      </View>
      <View style={styles.slideFooter}>
        <Pressable style={styles.primaryButton} onPress={handleComplete}>
          <Ionicons name="scan" size={20} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Start Scanning</Text>
        </Pressable>
      </View>
    </View>
  );

  const slides = [
    { key: 'welcome', component: WelcomeSlide },
    { key: 'diet', component: DietSlide },
    { key: 'allergen', component: AllergenSlide },
    { key: 'ready', component: ReadySlide },
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
        scrollEnabled={false} // Disable swipe, use buttons only
      />

      {/* Dot Indicator */}
      <View style={styles.indicatorContainer}>
        <DotIndicator totalDots={TOTAL_SLIDES} activeIndex={activeIndex} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: Spacing.xxxl + Spacing.xxl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl + Spacing.xl,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideHeader: {
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A9F7A',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.gray500,
    lineHeight: 22,
  },
  slideFooter: {
    paddingTop: Spacing.md,
  },

  // Welcome slide
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: Colors.gray700,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.white,
    letterSpacing: -2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureText: {
    fontSize: 15,
    color: Colors.gray700,
    fontWeight: '500',
  },

  // Diet slide
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
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
    fontSize: 28,
    marginRight: Spacing.md,
  },
  dietInfo: {
    flex: 1,
  },
  dietLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  dietLabelSelected: {
    color: '#4A7A4A',
  },
  dietDescription: {
    fontSize: 13,
    color: Colors.gray500,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7A9F7A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7A9F7A',
  },

  // Allergen slide
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
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
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  allergenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray600,
    textAlign: 'center',
  },
  allergenLabelSelected: {
    color: '#8B6914',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipHint: {
    fontSize: 13,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  // Ready slide
  readyIconContainer: {
    marginBottom: Spacing.lg,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  readySubtitle: {
    fontSize: 16,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray500,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.md,
  },
  editHint: {
    fontSize: 13,
    color: Colors.gray400,
    textAlign: 'center',
  },

  // Buttons
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
});
