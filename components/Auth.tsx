import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    else Alert.alert('Check your email for verification link!')
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.header}>PaddyDoc</Text>
        <Text style={styles.subtitle}>Paddy Disease Diagnosis</Text>
      </View>
      
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="Email"
          autoCapitalize={'none'}
          placeholderTextColor="#555"
        />
      </View>
      
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor="#555"
        />
      </View>
      
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.verticallySpaced}>
        <TouchableOpacity 
          style={[styles.button, styles.outlineButton]} 
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text style={styles.outlineButtonText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#eee',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#222',
    color: '#fff',
    height: 50,
    padding: 10,
    fontSize: 16,
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  outlineButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}) 