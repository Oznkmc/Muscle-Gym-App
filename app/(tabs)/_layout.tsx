import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native'; 
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!animationFinished) {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../../assets/splash.json')}
          autoPlay
          loop={false}
          resizeMode="contain"
          onAnimationFinish={() => setAnimationFinished(true)}
          style={styles.defaultAnimation}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e10600',
        headerShown: false,
        
        tabBarStyle: {
          backgroundColor: '#fff',
          height: Platform.OS === 'ios' ? 90 : 75, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 20, 
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 10, 
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 5 : 0, 
        }
      }}>

      <Tabs.Screen
        name="index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="signup"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diyet',
          tabBarIcon: ({ color }) => <Ionicons name="nutrition" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="measurements"
        options={{
          title: 'Ölçümler',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          title: 'Antrenman',
          tabBarIcon: ({ color }) => <Ionicons name="barbell" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ai_coach"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAnimation: {
    width: width,
    height: height,
  },
});