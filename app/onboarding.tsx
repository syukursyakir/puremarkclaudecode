import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { DotIndicator } from '@/components/onboarding/DotIndicator';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Colors, Spacing } from '@/constants/theme';

interface SlideData {
  id: string;
  logoText?: string;
  showLogo: boolean;
  showArrows: boolean;
  title: string;
  subtitle?: string;
  features?: string[];
  tags?: string[];
  buttonText: string;
}

const slides: SlideData[] = [
  {
    id: '1',
    logoText: 'Pm',
    showLogo: true,
    showArrows: false,
    title: 'Scan Ingredients Decide With Confidence',
    subtitle: 'AI-powered ingredient verification',
    features: [
      'Real-time AI breakdown',
      'Dietary & certification compliance checks',
      'Transparent ingredient explanations',
    ],
    buttonText: 'Get Started',
  },
  {
    id: '2',
    showLogo: false,
    showArrows: true,
    title: 'AI Ingredient Analyst',
    subtitle: 'Automatically analyzes ingredient lists using your dietary preferences and certification rules.',
    tags: ['Personalized', 'Certification-Grade', 'AI-Powered'],
    buttonText: 'Next Feature',
  },
  {
    id: '3',
    showLogo: false,
    showArrows: true,
    title: 'Accurate Ingredient Scanning',
    subtitle: 'Uses AI to detect and scan ingredients to get the most accurate results.',
    tags: ['Accurate', 'AI-Powered', 'Reliable'],
    buttonText: 'Start Scanning',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleButtonPress = async (index: number) => {
    if (index < slides.length - 1) {
      // Go to next slide
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      // Mark onboarding as complete and go to Scan tab
      await completeOnboarding();
      router.replace('/(tabs)/scan');
    }
  };

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => (
    <OnboardingSlide
      logoText={item.logoText}
      showLogo={item.showLogo}
      showArrows={item.showArrows}
      title={item.title}
      subtitle={item.subtitle}
      features={item.features}
      tags={item.tags}
      buttonText={item.buttonText}
      onButtonPress={() => handleButtonPress(index)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray100} />
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
      
      {/* Dot Indicator */}
      <View style={styles.indicatorContainer}>
        <DotIndicator totalDots={slides.length} activeIndex={activeIndex} />
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
});
