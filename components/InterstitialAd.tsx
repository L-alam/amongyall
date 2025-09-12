// components/InterstitialAd.tsx
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';

let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

// Only import AdMob components if not in Expo Go
if (!isExpoGo) {
  try {
    const admob = require('react-native-google-mobile-ads');
    InterstitialAd = admob.InterstitialAd;
    AdEventType = admob.AdEventType;
    TestIds = admob.TestIds;
  } catch (error) {
    console.warn('AdMob not available:', error);
  }
}

const adUnitId = __DEV__ ? 
  (TestIds?.INTERSTITIAL || 'test-id') : 
  'ca-app-pub-8062066976620321/2586223474';

let interstitial: any = null;

// Create interstitial ad if available
if (InterstitialAd && !isExpoGo) {
  interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    keywords: ['games', 'party', 'social'],
  });
}

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!interstitial || isExpoGo) {
      return;
    }

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      if (Platform.OS === 'ios') {
        StatusBar.setHidden(true);
      }
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      if (Platform.OS === 'ios') {
        StatusBar.setHidden(false);
      }
      // Reload ad for next time
      interstitial.load();
    });

    // Start loading the interstitial
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, []);

  const showAd = (onAdClosed?: () => void) => {
    if (isExpoGo) {
      console.log('Interstitial ad would show here (Expo Go)');
      // Simulate ad delay in Expo Go
      setTimeout(() => {
        onAdClosed?.();
      }, 1000);
      return;
    }

    if (loaded && interstitial) {
      if (onAdClosed) {
        const unsubscribe = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribe();
          onAdClosed();
        });
      }
      interstitial.show();
      setLoaded(false); // Reset loaded state
    } else {
      console.log('Interstitial ad not ready');
      onAdClosed?.(); // Continue without ad if not loaded
    }
  };

  return { loaded, showAd };
};