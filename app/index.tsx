import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isLoading, hasCompletedOnboarding } = useOnboarding();

  useEffect(() => {
    if (!isLoading) {
      if (hasCompletedOnboarding) {
        // User has completed onboarding, go to main app
        router.replace('/(tabs)/scan');
      } else {
        // User hasn't completed onboarding, show onboarding
        router.replace('/onboarding');
      }
    }
  }, [isLoading, hasCompletedOnboarding]);

  // Show loading spinner while checking onboarding status
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
