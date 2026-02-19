import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { AUTH_GUARD_ENABLED } from '../lib/constants/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute: Podmienečne pustí používateľa do chránenej časti alebo zobrazí prihlásenie.
 *
 * Prečo: Kontrola prístupu priamo pri route zabráni neautorizovaným vstupom do súkromných obrazoviek.
 */
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
    
    if (user) {
      hasRedirected.current = false;
    }
  }, [user, loading, navigation]);

  if (!AUTH_GUARD_ENABLED) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

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
