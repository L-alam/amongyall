// components/BannerAd.tsx (Expo Go Safe)
import Constants from 'expo-constants';
import React from 'react';
import { Platform, Text, View } from 'react-native';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export default function AdBanner() {
  // Always show placeholder in Expo Go
  if (isExpoGo) {
    return (
      <View style={{
        height: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
      }}>
        <Text style={{ color: '#666', fontSize: 12 }}>
          📱 Banner Ad (Will appear in TestFlight)
        </Text>
      </View>
    );
  }

  // This won't run in Expo Go, but will work in TestFlight
  const { BannerAd, BannerAdSize, TestIds, useForeground } = require('react-native-google-mobile-ads');
  const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-8062066976620321/5683692937';
  
  const bannerRef = React.useRef<any>(null);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  return (
    <BannerAd 
      ref={bannerRef} 
      unitId={adUnitId} 
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}