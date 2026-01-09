import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Required for expo-auth-session
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
      // Create redirect URI for Expo
      const redirectUri = makeRedirectUri({
        scheme: 'puremark',
        path: 'auth/callback',
      });

      console.log('Redirect URI:', redirectUri);

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      console.log('Opening OAuth URL:', data.url);

      // Open the OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      console.log('Auth result:', result);

      if (result.type === 'success' && result.url) {
        // Extract the tokens from the URL
        const url = new URL(result.url);

        // Check for hash fragment (Supabase returns tokens in hash)
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          // Set the session with the tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;

          console.log('Session set successfully:', sessionData.user?.email);
        } else {
          // Check for error in URL
          const errorParam = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          if (errorParam) {
            throw new Error(errorDescription || errorParam);
          }
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled the auth flow');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
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
