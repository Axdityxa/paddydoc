import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { analyzePaddyDisease } from '../lib/gemini'
import { Audio } from 'expo-av'

// Helper function to parse and format analysis results
const formatAnalysisResult = (text: string) => {
  // Check for errors
  if (text.startsWith('Error analyzing image:')) {
    return {
      error: true,
      sections: [{ title: 'Error', content: text.replace('Error analyzing image:', '').trim() }]
    };
  }

  // Split the text into sections based on numbered points or paragraph breaks
  const sections = [];
  
  // Check if it's a healthy plant message
  if (text.toLowerCase().includes('healthy')) {
    return {
      error: false,
      isHealthy: true,
      sections: [{ title: 'Analysis Result', content: text }]
    };
  }

  // Process structured disease information
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let currentSection = null;

  for (const line of lines) {
    // Check for numbered points (1., 2., etc.) or specific keywords
    if (line.match(/^\d+\.\s/) || 
        line.toLowerCase().includes('disease name') ||
        line.toLowerCase().includes('severity') ||
        line.toLowerCase().includes('symptoms') ||
        line.toLowerCase().includes('treatment')) {
      
      // If we have a current section, add it to sections array
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Extract title from the line
      const titleMatch = line.match(/^(\d+\.\s*\*\*([^:*]+)\*\*:?)|^(\d+\.\s*([^:]+):?)/);
      let title = '';
      let content = line;
      
      if (titleMatch) {
        title = titleMatch[2] || titleMatch[4] || '';
        title = title.replace(/\*\*/g, '').trim();
        content = line.replace(titleMatch[0], '').trim();
      } else if (line.includes(':')) {
        const parts = line.split(':');
        title = parts[0].replace(/\*\*/g, '').trim();
        content = parts.slice(1).join(':').trim();
      }
      
      currentSection = { title, content };
    } else if (currentSection) {
      // Append to current section content
      currentSection.content += '\n' + line;
    } else {
      // If no current section but there's text, create a general section
      sections.push({ title: 'Overview', content: line });
    }
  }

  // Add the last section if it exists
  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    error: false,
    isHealthy: false,
    sections
  };
};

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraVisible, setCameraVisible] = useState(false)
  const [cameraRef, setCameraRef] = useState<any>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [formattedResult, setFormattedResult] = useState<any>(null)

  // Play camera shutter sound
  const playShutterSound = async () => {
    try {
      // Correct implementation of Audio.Sound API
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({
        uri: 'https://assets.mixkit.co/active_storage/sfx/2619/2619-preview.mp3'
      });
      await soundObject.playAsync();
      
      // Unload after playing to avoid memory leaks
      soundObject.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          soundObject.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing camera sound:', error);
      // Continue with taking picture even if sound fails
    }
  };

  // Request camera permission
  const requestCameraAccess = async () => {
    if (!permission) {
      return
    }
    
    if (!permission.granted) {
      const result = await requestPermission()
      if (result.granted) {
        setCameraVisible(true)
      } else {
        Alert.alert('Camera permission not granted')
      }
    } else {
      setCameraVisible(true)
    }
  }

  // Take a photo with the camera
  const takePicture = async () => {
    if (cameraRef) {
      try {
        // Play shutter sound
        playShutterSound();
        
        // Take picture
        const photo = await cameraRef.takePictureAsync();
        setImage(photo.uri);
        setCameraVisible(false);
        
        // Reset analysis result when taking a new picture
        setAnalysisResult(null);
        setFormattedResult(null);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  }

  // Pick an image from the gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!')
      return
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      // Reset analysis result when selecting a new image
      setAnalysisResult(null)
      setFormattedResult(null)
    }
  }

  // Sign out the user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        Alert.alert('Error signing out', error.message)
      }
      // Wait a moment to ensure auth state changes are processed
      setTimeout(() => {
        // The App.tsx component will handle the redirect via onAuthStateChange
        console.log('User signed out successfully')
      }, 100)
    } catch (e) {
      console.error('Error signing out:', e)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    }
  }

  // Analyze the image for paddy disease using Gemini
  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('No image', 'Please take or select an image first')
      return
    }

    try {
      setAnalyzing(true)
      setAnalysisResult(null)
      setFormattedResult(null)
      
      // Call the Gemini API to analyze the image
      const result = await analyzePaddyDisease(image)
      
      // Update the state with the analysis result
      setAnalysisResult(result)
      
      // Format the result for better display
      setFormattedResult(formatAnalysisResult(result))
    } catch (error) {
      Alert.alert('Analysis error', error.message)
      console.error('Error analyzing image:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Render a section of the analysis result
  const renderSection = (section, index) => {
    return (
      <View key={index} style={styles.resultSection}>
        {section.title && (
          <Text style={styles.resultSectionTitle}>{section.title}</Text>
        )}
        <Text style={styles.resultSectionContent}>{section.content}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {cameraVisible ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={'back' as CameraType}
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <Text style={styles.captureButtonText}>Capture</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setCameraVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PaddyDoc</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.imageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    No image selected. Take a picture or choose from gallery.
                  </Text>
                </View>
              )}
            </View>

            {formattedResult && (
              <View style={[
                styles.resultContainer,
                formattedResult.error ? styles.errorContainer : 
                formattedResult.isHealthy ? styles.healthyContainer : styles.diseaseContainer
              ]}>
                <ScrollView style={styles.resultScroll}>
                  {formattedResult.error ? (
                    <View style={styles.errorView}>
                      <Text style={styles.errorTitle}>Analysis Error</Text>
                      <Text style={styles.errorText}>{formattedResult.sections[0].content}</Text>
                    </View>
                  ) : formattedResult.isHealthy ? (
                    <View style={styles.healthyView}>
                      <Text style={styles.healthyTitle}>Plant Health Analysis</Text>
                      <Text style={styles.healthyText}>{formattedResult.sections[0].content}</Text>
                    </View>
                  ) : (
                    <View>
                      {formattedResult.sections.map((section, index) => 
                        renderSection(section, index)
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={requestCameraAccess}
            >
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={pickImage}
            >
              <Text style={styles.actionButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {image && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.analyzeButton, analyzing && styles.disabledButton]} 
                onPress={analyzeImage}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Analyze Disease</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  logoutButtonText: {
    color: '#FF5252',
    fontSize: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  placeholderContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  diseaseContainer: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  healthyContainer: {
    backgroundColor: '#1C2F2A',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  errorContainer: {
    backgroundColor: '#2D2626',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  resultScroll: {
    flex: 1,
  },
  resultSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultSectionTitle: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  resultSectionContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  errorView: {
    padding: 10,
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  healthyView: {
    padding: 10,
  },
  healthyTitle: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthyText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
    width: 120,
    alignItems: 'center',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
    width: 120,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
}) 