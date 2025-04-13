import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraVisible, setCameraVisible] = useState(false)
  const [cameraRef, setCameraRef] = useState<any>(null)
  const [permission, requestPermission] = useCameraPermissions()

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
      const photo = await cameraRef.takePictureAsync()
      setImage(photo.uri)
      setCameraVisible(false)
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
    }
  }

  // Sign out the user
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert(error.message)
  }

  // Analyze the image for paddy disease
  const analyzeImage = () => {
    // This is where you would connect to your model
    // For now, we'll just show a placeholder message
    Alert.alert('Analysis complete', 'This feature will be implemented soon')
  }

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
                style={[styles.actionButton, styles.analyzeButton]} 
                onPress={analyzeImage}
              >
                <Text style={styles.actionButtonText}>Analyze Disease</Text>
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