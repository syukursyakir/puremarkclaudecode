import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Required for expo-web-browser to close properly
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: boolean;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for saved guest state
    AsyncStorage.getItem('@puremark_is_guest').then((value) => {
      if (value === 'true') {
        setIsGuest(true);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          setIsGuest(false);
          await AsyncStorage.removeItem('@puremark_is_guest');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Create redirect URL using AuthSession for proper Expo Go handling
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'puremark',
        path: 'auth/callback',
      });
      console.log('Redirect URL:', redirectUrl);

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      console.log('Opening Google sign-in...');
      console.log('OAuth URL:', data.url);

      // Use openAuthSessionAsync which properly handles the OAuth redirect
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: false,
          preferEphemeralSession: true,
        }
      );

      console.log('Auth session result:', result);

      if (result.type === 'success' && result.url) {
        console.log('Success! URL:', result.url);

        // Extract tokens from the URL fragment
        const url = result.url;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        // Tokens are in the URL fragment (after #)
        if (url.includes('#')) {
          const fragment = url.split('#')[1];
          const params = new URLSearchParams(fragment);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
        }

        if (accessToken && refreshToken) {
          console.log('Got tokens, setting session...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            Alert.alert('Login Error', sessionError.message);
          } else {
            console.log('Login successful!');
            // Clear guest state since user is now logged in
            setIsGuest(false);
            await AsyncStorage.removeItem('@puremark_is_guest');
          }
        } else {
          console.log('No tokens found in URL');
          // Try to get session anyway (might have been set via URL listener)
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('Session found:', sessionData.session.user?.email);
          }
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled sign-in');
      } else if (result.type === 'dismiss') {
        console.log('Browser was dismissed');
        // Check if session was established anyway
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('Session found after dismiss:', sessionData.session.user?.email);
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      Alert.alert('Sign In Error', 'Failed to sign in with Google. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsGuest(false);
      await AsyncStorage.removeItem('@puremark_is_guest');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = async () => {
    setIsGuest(true);
    await AsyncStorage.setItem('@puremark_is_guest', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
        isGuest,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
