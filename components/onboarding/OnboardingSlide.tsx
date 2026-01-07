import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface OnboardingSlideProps {
  logoText?: string;
  showLogo?: boolean;
  title: string;
  subtitle?: string;
  features?: string[];
  tags?: string[];
  buttonText: string;
  onButtonPress: () => void;
  showArrows?: boolean;
}

export function OnboardingSlide({
  logoText = 'Pm',
  showLogo = true,
  title,
  subtitle,
  features,
  tags,
  buttonText,
  onButtonPress,
  showArrows = false,
}: OnboardingSlideProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      {/* Top Section - Logo or Arrows */}
      <View style={styles.topSection}>
        {showLogo ? (
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{logoText}</Text>
          </View>
        ) : showArrows ? (
          <View style={styles.arrowsContainer}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        ) : (
          <View style={styles.placeholderTop} />
        )}
      </View>

      {/* Middle Section - Content */}
      <View style={styles.middleSection}>
        <Text style={styles.title}>{title}</Text>
        
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {features && features.length > 0 && (
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {tags && tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <React.Fragment key={index}>
                <Text style={styles.tagText}>{tag}</Text>
                {index < tags.length - 1 && (
                  <View style={styles.tagDot} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Bottom Section - Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onButtonPress}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  arrowsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 48,
    color: Colors.gray400,
  },
  placeholderTop: {
    height: 120,
  },
  middleSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  featuresContainer: {
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
  bottomSection: {
    paddingTop: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.gray200,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.black,
  },
});
