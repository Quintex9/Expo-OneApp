// components/ProtectedRoute.tsx
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { AUTH_GUARD_ENABLED } from '../lib/constants/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigation = useNavigation<any>();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!AUTH_GUARD_ENABLED) {
      return;
    }

    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      navigation.replace('Login');
    }
    
    // Reset flag keď sa používateľ prihlási
    if (user) {
      hasRedirected.current = false;
    }
  }, [user, loading, navigation]);

  // Temporary bypass for testing without login.
  if (!AUTH_GUARD_ENABLED) {
    return <>{children}</>;
  }

  // Zobraz loading indikátor počas načítavania
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  // Ak nie je prihlásený, nevracaj nič (presmerovanie sa deje v useEffect)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  // Používateľ je prihlásený, zobraz obsah
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
