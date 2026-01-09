import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isLoading: onboardingLoading, hasCompletedOnboarding } = useOnboarding();
  const { loading: authLoading, user, isGuest } = useAuth();

  useEffect(() => {
    // Wait for both checks to complete
    if (onboardingLoading || authLoading) return;

    if (!hasCompletedOnboarding) {
      // User hasn't completed onboarding, show onboarding first
      router.replace('/onboarding');
    } else if (!user && !isGuest) {
      // User hasn't logged in and isn't a guest, show login
      router.replace('/login');
    } else {
      // User is logged in or guest, go to main app
      router.replace('/(tabs)/scan');
    }
  }, [onboardingLoading, authLoading, hasCompletedOnboarding, user, isGuest]);

  // Show loading spinner while checking status
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.gray600} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
});
