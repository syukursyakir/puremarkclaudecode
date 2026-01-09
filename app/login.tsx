import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Sign In Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Logo and Title */}
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: isDark ? Colors.gray800 : Colors.gray100 }]}>
          <Ionicons name="leaf-outline" size={48} color={theme.text} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>PureMark</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Halal & Kosher Food Scanner
        </Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefits}>
        <View style={styles.benefitRow}>
          <Ionicons name="cloud-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
            Sync your scan history across devices
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
            Save your dietary preferences securely
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="time-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
            Quick access to your scan history
          </Text>
        </View>
      </View>

      {/* Sign In Buttons */}
      <View style={styles.buttonContainer}>
        {/* Google Sign In */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            { backgroundColor: isDark ? Colors.white : Colors.black }
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? Colors.black : Colors.white} />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={20}
                color={isDark ? Colors.black : Colors.white}
                style={styles.buttonIcon}
              />
              <Text style={[
                styles.buttonText,
                { color: isDark ? Colors.black : Colors.white }
              ]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple Sign In - Only show on iOS */}
        {/* TODO: Enable when Apple Developer account is set up */}
        {/* <TouchableOpacity
          style={[
            styles.button,
            styles.appleButton,
            { backgroundColor: isDark ? Colors.white : Colors.black }
          ]}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          <Ionicons
            name="logo-apple"
            size={20}
            color={isDark ? Colors.black : Colors.white}
            style={styles.buttonIcon}
          />
          <Text style={[
            styles.buttonText,
            { color: isDark ? Colors.black : Colors.white }
          ]}>
            Continue with Apple
          </Text>
        </TouchableOpacity> */}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Continue as Guest */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.guestButton,
            { borderColor: theme.border }
          ]}
          onPress={handleContinueAsGuest}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>

        <Text style={[styles.guestNote, { color: theme.textMuted }]}>
          Your data will be stored locally on this device only
        </Text>
      </View>

      {/* Terms */}
      <Text style={[styles.terms, { color: theme.textMuted }]}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  benefits: {
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
  },
  googleButton: {},
  appleButton: {},
  guestButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    ...Typography.button,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
  },
  guestNote: {
    ...Typography.caption,
    textAlign: 'center',
  },
  terms: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
