import React, { useState, useEffect, ErrorInfo } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Modal, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import HomeScreen from './screens/HomeScreen';
import { SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY } from '@env';

// Debug component to check environment variables
const DebugModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Debug Information</Text>
          
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          <Text style={styles.debugLabel}>SUPABASE_URL:</Text>
          <Text style={styles.debugValue}>{SUPABASE_URL || 'Not set'}</Text>
          
          <Text style={styles.debugLabel}>SUPABASE_ANON_KEY:</Text>
          <Text style={styles.debugValue}>
            {SUPABASE_ANON_KEY ? (SUPABASE_ANON_KEY.substring(0, 15) + '...') : 'Not set'}
          </Text>
          
          <Text style={styles.debugLabel}>GEMINI_API_KEY:</Text>
          <Text style={styles.debugValue}>
            {GEMINI_API_KEY ? (GEMINI_API_KEY.substring(0, 15) + '...') : 'Not set'}
          </Text>

          <Text style={styles.sectionTitle}>Troubleshooting Steps</Text>
          <Text style={styles.troubleshootingText}>
            1. Make sure your .env file is correctly loaded
          </Text>
          <Text style={styles.troubleshootingText}>
            2. Check that all required permissions are granted
          </Text>
          <Text style={styles.troubleshootingText}>
            3. Ensure network connectivity for Supabase and Gemini API
          </Text>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Error boundary component to catch JS errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error caught by error boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <ScrollView>
            <Text style={styles.errorTitle}>App Error</Text>
            <Text style={styles.errorText}>
              {this.state.error?.toString()}
            </Text>
            <Text style={styles.errorStack}>
              {this.state.errorInfo?.componentStack}
            </Text>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => {
                // Reset error state
                this.setState({ hasError: false, error: null, errorInfo: null });
              }}
            >
              <Text style={styles.reportButtonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    // Log environment variables for debugging
    console.log("Environment check:", {
      supabaseUrl: SUPABASE_URL ? "Set" : "Not set",
      supabaseKey: SUPABASE_ANON_KEY ? "Set" : "Not set",
      geminiKey: GEMINI_API_KEY ? "Set" : "Not set"
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.error("Supabase session error:", error);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Handle header taps to show debug modal (only in development)
  const handleHeaderTap = () => {
    // Only enable debug mode in development builds
    if (__DEV__) {
      setTapCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 5) {
          setShowDebug(true);
          return 0;
        }
        return newCount;
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar style="light" />
        {/* Move debug button to top left corner to avoid conflict with logout */}
        {__DEV__ && (
          <TouchableOpacity 
            onPress={handleHeaderTap} 
            style={styles.debugButton} 
            activeOpacity={1}
          >
            <Text> </Text>
          </TouchableOpacity>
        )}
        {session && session.user ? <HomeScreen /> : <Auth />}
        <DebugModal visible={showDebug} onClose={() => setShowDebug(false)} />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#300',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  errorStack: {
    fontSize: 14,
    color: '#ddd',
    fontFamily: 'monospace',
  },
  reportButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  debugButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 50,
    height: 50,
    zIndex: 9999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#242424',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 15,
    marginBottom: 10,
  },
  debugLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 5,
  },
  debugValue: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 